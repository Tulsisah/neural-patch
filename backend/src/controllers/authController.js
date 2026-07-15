const User = require('../models/User');
const githubService = require('../services/githubService');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.SANDBOX_MODE === 'true' ? 'sandbox-jwt-secret-key-10298' : null);

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing and is required for secure authentication.');
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (password.length > 64) {
      return res.status(400).json({ error: 'Password must be at most 64 characters' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }
    user = await User.create({ name, email, password });
    const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { name: user.name, email: user.email } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'User already exists' }); // Handle race condition
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Simple admin mock signin logic for sandbox console login
    if (email === 'admin@neuralpatch.io' && process.env.SANDBOX_MODE === 'true' && process.env.NODE_ENV !== 'production') {
      let mockUser = await User.findOne({ email: 'admin@neuralpatch.io' });
      if (!mockUser) {
        mockUser = await User.create({
          name: 'SecOps Manager',
          email: 'admin@neuralpatch.io',
          password: 'sandbox_mock_pass'
        });
      }
      const token = jwt.sign({ userId: mockUser._id, name: mockUser.name }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ token, user: { name: mockUser.name, email } });
    }

    // Find user and explicitly select the password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user: { name: user.name, email: user.email } });
  } catch (error) {
    next(error);
  }
};

// Handle GitHub OAuth callback and token exchange
exports.githubCallback = async (req, res, next) => {
  try {
    const { code, state } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'OAuth code missing' });
    }

    // 1. Exchange code for access token (and verify CSRF state)
    const accessToken = await githubService.getAccessToken(code, state);
    
    // 2. Fetch user details from GitHub
    const profile = await githubService.getUserProfile(accessToken);

    // 3. Find or Create user in MongoDB
    let user = await User.findOne({ githubId: profile.id.toString() }).select('+githubToken');
    if (!user) {
      let primaryEmail = profile.email;
      if (!primaryEmail) {
        const emails = await githubService.getUserEmails(accessToken);
        const primary = emails.find(e => e.primary && e.verified);
        primaryEmail = primary ? primary.email : `${profile.login}@users.noreply.github.com`;
      }
      
      // Check if user already exists with this email to prevent duplicate key error
      user = await User.findOne({ email: primaryEmail });
      if (user) {
        user.githubId = profile.id.toString();
        user.githubToken = accessToken;
        if (!user.name) user.name = profile.name || profile.login;
        await user.save();
      } else {
        user = new User({
          githubId: profile.id.toString(),
          name: profile.name || profile.login,
          email: primaryEmail,
          password: require('crypto').randomBytes(32).toString('hex'),
          githubToken: accessToken
        });
        await user.save();
      }
    } else {
      user.githubToken = accessToken;
      user.name = profile.name || profile.login;
      await user.save();
    }

    // 4. Generate local JWT token
    const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user: { name: user.name, email: user.email } });

  } catch (error) {
    logger.error(`Error during GitHub callback: ${error.stack}`);
    res.status(500).json({ error: 'OAuth callback exchange failed' });
  }
};

exports.githubAuth = (req, res) => {
  const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/auth/github/callback';
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'GITHUB_CLIENT_ID is not configured' });
  }
  const state = require('crypto').randomBytes(16).toString('hex');
  const scope = 'read:user user:email repo';
  
  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  res.redirect(githubUrl);
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({
      user: {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const User = require('../models/User');
    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak whether user exists, just return success
      return res.status(200).json({ message: 'If that email is in our database, we have sent a password reset link.' });
    }
    
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();
    
    // In a real application, send this token via email
    // Since we don't have an email service, we'll log it and also return it if SANDBOX_MODE is true
    const logger = require('../utils/logger');
    logger.info(`[FORGOT PASSWORD] Reset token for ${email}: ${resetToken}`);
    
    if (process.env.SANDBOX_MODE === 'true') {
      return res.status(200).json({ 
        message: 'Sandbox mode: email sending simulated.',
        sandbox_reset_token: resetToken 
      });
    }

    res.status(200).json({ message: 'If that email is in our database, we have sent a password reset link.' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const User = require('../models/User');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token is invalid or has expired' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};
