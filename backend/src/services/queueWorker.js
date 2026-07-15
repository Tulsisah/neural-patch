const { Worker } = require('bullmq');
const { connection } = require('../config/redis');
const logger = require('../utils/logger');
const githubService = require('./githubService');
const aiService = require('./aiService');
const Repo = require('../models/Repo');
const ScanReport = require('../models/ScanReport');

class QueueWorkerManager {
  constructor() {
    this.worker = null;
  }

  start() {
    this.worker = new Worker('scan-queue', async (job) => {
      const { repoFullName, prNumber, commitHash, owner, repoName, installationId, repoId } = job.data;
      logger.info(`[Job ${job.id}] Processing scan job for repo: ${repoFullName}, commit: ${commitHash}`);

      // Create ScanReport in 'scanning' state
      const scanReport = await ScanReport.create({
        repoId,
        prNumber: prNumber || null,
        commitHash,
        status: 'scanning',
        vulnerabilities: [],
        createdAt: new Date()
      });

      try {
        // 1. Fetch the Git Diff
        let diff = '';
        if (prNumber) {
          diff = await githubService.fetchPullRequestDiff(owner, repoName, prNumber);
        } else {
          diff = await githubService.fetchCommitDiff(owner, repoName, commitHash);
        }

        if (!diff || diff.trim() === '') {
          logger.info(`[Job ${job.id}] No code changes found in diff for ${repoFullName}`);
          scanReport.status = 'completed';
          await scanReport.save();
          return;
        }

        // 2. Call AI Service to scan the diff
        let findings = await aiService.analyzeVulnerabilities(diff, job.data.model || 'gemini-1.5-flash');
        if (!Array.isArray(findings)) {
          logger.warn(`[Job ${job.id}] AI analysis returned non-array response for ${repoFullName}. Defaulting to empty array.`);
          findings = [];
        }

        // Limit findings to prevent MongoDB 16MB document limit (OOM/crash prevention)
        if (findings.length > 200) {
          logger.warn(`[Job ${job.id}] Vulnerabilities array size (${findings.length}) exceeds 200 limit for ${repoFullName}. Truncating to 200.`);
          findings = findings.slice(0, 200);
        }

        logger.info(`[Job ${job.id}] AI analysis complete. Found ${findings.length} issues.`);

        // 3. Save findings to ScanReport
        scanReport.vulnerabilities = findings.map(item => ({
          file: item.file,
          line: item.line,
          title: item.title,
          severity: item.severity,
          description: item.description,
          codeSnippet: item.codeSnippet || '',
          suggestion: item.suggestion,
          isPatched: false
        }));
        scanReport.status = 'completed';
        await scanReport.save();

        // 4. Update Repo Health Score dynamically
        // We deduct 15 points per critical, 8 per high, 3 per medium, 1 per low, down to minimum 0
        const activeRepo = await Repo.findById(repoId);
        if (activeRepo) {
          let scoreDeduction = 0;
          findings.forEach(f => {
            if (f.severity === 'critical') scoreDeduction += 15;
            else if (f.severity === 'high') scoreDeduction += 8;
            else if (f.severity === 'medium') scoreDeduction += 3;
            else scoreDeduction += 1;
          });
          const baseScore = 100;
          activeRepo.healthScore = Math.max(0, baseScore - scoreDeduction);
          activeRepo.lastScanDate = new Date();
          await activeRepo.save();
        }

        // 5. If it's a PR, post secure patches as Review Comments
        if (prNumber && findings.length > 0) {
          const repoConfig = await Repo.findById(repoId);
          // Only post PR comments if autoPatch is enabled on this repo
          if (repoConfig && repoConfig.isActive) { // using isActive as autoPatch toggle
            for (let i = 0; i < findings.length; i++) {
              const vuln = findings[i];
              try {
                const commentId = await githubService.postPRComment(
                  owner,
                  repoName,
                  prNumber,
                  commitHash,
                  vuln
                );
                // Save comment ID back to report
                scanReport.vulnerabilities[i].githubCommentId = commentId;
              } catch (err) {
                logger.error(`[Job ${job.id}] Error posting PR comment for ${vuln.title}: ${err.message}`);
              }
              // Delay to prevent GitHub API secondary rate limit
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            scanReport.markModified('vulnerabilities');
            await scanReport.save();
          }
        }

      } catch (error) {
        logger.error(`[Job ${job.id}] Error processing job for ${repoFullName}: ${error.stack}`);
        scanReport.status = 'failed';
        await scanReport.save();
        throw error;
      }
    }, { 
      connection,
      concurrency: 1 // Reduced to 1 to prevent race conditions on healthScore updates
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`[Job ${job.id}] failed with error: ${err.message}`);
    });

    this.worker.on('completed', (job) => {
      logger.info(`[Job ${job.id}] completed successfully`);
    });

    logger.info('Queue worker successfully running on scan-queue');
  }

  stop() {
    if (this.worker) {
      this.worker.close();
      logger.info('Queue worker stopped');
    }
  }
}

module.exports = new QueueWorkerManager();
