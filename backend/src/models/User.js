const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Get the encryption key from environment variables (or local sandbox fallback)
const RAW_KEY = process.env.ENCRYPTION_KEY || 'd3f6d71b56934c9c8a9947f631bcde41'; 
const IV_LENGTH = 16;

// Derive a cryptographically secure 32-byte (256-bit) key buffer from the raw key using SHA-256.
// This prevents key length errors and ensures it is exactly 32 bytes for aes-256-cbc regardless of input string length.
const ENCRYPTION_KEY = crypto.createHash('sha256').update(RAW_KEY).digest();

function encrypt(text) {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (err) {
    logger.error(`Token encryption failed: ${err.message}`);
    throw new Error('Encryption failed');
  }
}

function decrypt(text) {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    logger.error(`Token decryption failed: ${err.message}`);
    throw new Error('Decryption failed');
  }
}

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: { type: String, select: false },
  githubId: String,
  githubToken: { 
    type: String, 
    select: false,
    get: decrypt,
    set: encrypt
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
