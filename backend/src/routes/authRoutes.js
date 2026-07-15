const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../utils/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/github', authController.githubAuth);
router.post('/github/callback', authController.githubCallback);
router.get('/me', authMiddleware, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
