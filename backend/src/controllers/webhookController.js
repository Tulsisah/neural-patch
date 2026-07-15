const crypto = require('crypto');
const logger = require('../utils/logger');
const { addScanJob } = require('../services/queueService');
const Repo = require('../models/Repo');

exports.handleGithubWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    const deliveryId = req.headers['x-github-delivery'];
    
    logger.info(`Received GitHub webhook. Event: ${event}, Delivery ID: ${deliveryId}`);

    // Replay attack prevention: Cache and deduplicate X-GitHub-Delivery ID in Redis
    if (deliveryId && process.env.SANDBOX_MODE !== 'true') {
      try {
        const { connection } = require('../config/redis');
        const isReplay = await connection.get(`webhook:delivery:${deliveryId}`);
        if (isReplay) {
          logger.warn(`Duplicate webhook delivery detected (Replay Attack): ${deliveryId}`);
          return res.status(200).send('Duplicate request ignored');
        }
        // Cache the delivery ID for 1 hour (3600 seconds)
        await connection.set(`webhook:delivery:${deliveryId}`, 'true', 'EX', 3600);
      } catch (err) {
        logger.warn(`Skipping replay check: Redis cache error: ${err.message}`);
      }
    }

    // 1. Verify webhook signature
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      logger.error('Webhook verification failed: GITHUB_WEBHOOK_SECRET is not configured');
      return res.status(500).send('Webhook configuration error');
    }
    if (!signature) {
      logger.warn('Webhook signature missing');
      return res.status(401).send('Signature missing');
    }
      
      if (!req.rawBody) {
        logger.error('Webhook verification failed: rawBody parsing middleware is missing or not configured');
        return res.status(500).send('Webhook configuration error');
      }

      const hmac = crypto.createHmac('sha256', secret);
      const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');
      
      try {
        const sigBuffer = Buffer.from(signature);
        const digestBuffer = Buffer.from(digest);
        if (sigBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(sigBuffer, digestBuffer)) {
          logger.warn('Webhook verification failed: Signature mismatch');
          return res.status(401).send('Signature mismatch');
        }
      } catch (e) {
        logger.warn('Webhook verification failed: Signature comparison error');
        return res.status(401).send('Signature mismatch');
      }

    const payload = req.body;

    // 2. Validate payload structures
    if (!payload.repository) {
      return res.status(400).send('Invalid webhook payload structure');
    }

    const repoName = payload.repository.name;
    const owner = payload.repository.owner.login;
    const repoFullName = payload.repository.full_name;

    // 3. Query repository configurations in database
    const dbRepo = await Repo.findOne({ 
      name: { $regex: new RegExp(`^${repoName}$`, 'i') }, 
      owner: { $regex: new RegExp(`^${owner}$`, 'i') } 
    });
    if (!dbRepo) {
      logger.info(`Repo ${repoFullName} is not connected to NeuralPatch. Ignoring webhook.`);
      return res.status(200).json({ status: 'ignored', reason: 'repository not registered' });
    }

    let jobData = {
      repoId: dbRepo._id,
      repoName,
      owner,
      repoFullName,
      installationId: payload.installation?.id || null
    };

    // 4. Handle pull_request event triggers
    if (event === 'pull_request') {
      const allowedActions = ['opened', 'synchronize', 'reopened', 'closed'];
      if (!allowedActions.includes(payload.action)) {
        return res.status(200).json({ status: 'ignored', reason: `action ${payload.action} not monitored` });
      }

      if (payload.action === 'closed') {
        jobData.commitHash = payload.pull_request.base.sha;
        jobData.branch = payload.pull_request.base.ref;
        jobData.prNumber = null;
        
        logger.info(`PR closed/merged. Enqueuing base branch scan for ${repoFullName}`);
        await addScanJob(jobData);
        return res.status(202).json({ status: 'queued', type: 'pull_request_closed', branch: jobData.branch });
      }

      jobData.prNumber = payload.pull_request.number;
      jobData.commitHash = payload.pull_request.head.sha;
      jobData.branch = payload.pull_request.head.ref;
      
      logger.info(`Enqueuing scan for PR #${jobData.prNumber} in ${repoFullName}`);
      await addScanJob(jobData);
      return res.status(202).json({ status: 'queued', type: 'pull_request', prNumber: jobData.prNumber });
    }

    // 5. Handle commit push event triggers
    if (event === 'push') {
      // Ignore tag pushes and deletion branch events
      if (payload.deleted || !payload.after || payload.after === '0000000000000000000000000000000000000000') {
        return res.status(200).json({ status: 'ignored', reason: 'branch deletion push' });
      }
      
      if (payload.ref && payload.ref.startsWith('refs/tags/')) {
        return res.status(200).json({ status: 'ignored', reason: 'tag push' });
      }

      jobData.commitHash = payload.after;
      jobData.branch = payload.ref.replace('refs/heads/', '');
      jobData.prNumber = null;

      logger.info(`Enqueuing scan for Push commit ${jobData.commitHash} in ${repoFullName}`);
      await addScanJob(jobData);
      return res.status(202).json({ status: 'queued', type: 'push', commit: jobData.commitHash });
    }

    return res.status(200).json({ status: 'ignored', reason: `unsupported event type: ${event}` });

  } catch (error) {
    logger.error(`Error processing webhook payload: ${error.stack}`);
    // Return 503 Service Unavailable with Retry-After header to instruct GitHub to replay the webhook
    res.set('Retry-After', '60'); // Instruct GitHub to retry after 60 seconds
    return res.status(503).json({ error: 'Service Unavailable, please retry' });
  }
};
