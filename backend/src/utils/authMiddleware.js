const jwt = require('jsonwebtoken');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.SANDBOX_MODE === 'true' ? 'sandbox-jwt-secret-key-10298' : null);

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing and is required for secure authentication.');
}

module.exports = (req, res, next) => {
  const isSandbox = process.env.SANDBOX_MODE === 'true' && process.env.NODE_ENV !== 'production';

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (isSandbox) {
        req.user = { userId: '507f1f77bcf86cd799439011', name: 'SecOps Manager', email: 'admin@neuralpatch.io' };
        return next();
      }
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`JWT verification failed: ${error.message}`);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
