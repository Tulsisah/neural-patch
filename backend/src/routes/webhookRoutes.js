const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/github', webhookController.handleGithubWebhook);

module.exports = router;
