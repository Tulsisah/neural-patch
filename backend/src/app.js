require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default || require('rate-limit-redis');
const { connection: redisClient } = require('./config/redis');
const authRoutes = require('./routes/authRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const apiRoutes = require('./routes/apiRoutes');
const errorHandler = require('./utils/errorHandler');

const app = express();

const sendCommandWithWait = async (...args) => {
  if (redisClient.status !== 'ready') {
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (redisClient.status === 'ready') {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }
  return redisClient.call(...args);
};

// Secure Express apps by setting various HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.github.com"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse incoming request JSON bodies
app.use(express.json({
  limit: '5mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Parse URL-encoded bodies for GitHub webhooks or other form submissions
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// General rate limiter
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: sendCommandWithWait,
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Stricter rate limiter for authentication routes
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: sendCommandWithWait,
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' }
});

// Webhook rate limiter (high capacity but still protected against DoS)
const webhookLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: sendCommandWithWait,
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Allow up to 2000 webhook events per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Webhook delivery limit exceeded' }
});

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/webhooks', webhookLimiter, webhookRoutes);
app.use('/api', apiLimiter, apiRoutes);

// Error Handling
app.use(errorHandler);

module.exports = app;
