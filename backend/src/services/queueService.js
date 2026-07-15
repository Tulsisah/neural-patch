const { Queue } = require('bullmq');
const { connection } = require('../config/redis');

const scanQueue = new Queue('scan-queue', { connection });

const addScanJob = async (payload) => {
  try {
    return await scanQueue.add('scan-job', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: { count: 100 }
    });
  } catch (error) {
    console.error(`[QueueService] Failed to add scan job to Redis queue: ${error.message}`);
    throw new Error('Failed to enqueue scan job due to internal queue error.');
  }
};

module.exports = {
  scanQueue,
  addScanJob,
};
