const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const repoController = require('../controllers/repoController');
const scanController = require('../controllers/scanController');
const authMiddleware = require('../utils/authMiddleware');

const validateObjectId = (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
};

router.param('id', validateObjectId);
router.param('scanId', validateObjectId);

// Repositories management API
router.get('/repos', authMiddleware, repoController.listRepos);
router.post('/repos', authMiddleware, repoController.connectRepo);
router.delete('/repos/:id', authMiddleware, repoController.disconnectRepo);
router.post('/repos/:id/auto-patch', authMiddleware, repoController.toggleAutoPatch);
router.post('/chat', authMiddleware, repoController.chatAboutRepos);
router.post('/chat/patch', authMiddleware, repoController.applyChatPatch);

// GitHub API Proxy
router.get('/github/repos', authMiddleware, repoController.getAvailableRepos);

// Scan reports API
router.get('/scans', authMiddleware, scanController.listScans);
router.get('/scans/metrics', authMiddleware, scanController.getMetrics);
router.post('/scans', authMiddleware, scanController.triggerScan);
router.post('/scans/global', authMiddleware, scanController.triggerGlobalScan);
router.get('/scans/:scanId', authMiddleware, scanController.getScanReport);
router.post('/scans/:scanId/apply-patch', authMiddleware, scanController.applyPatch);
router.post('/scans/:scanId/revoke-patch', authMiddleware, scanController.revokePatch);

module.exports = router;
