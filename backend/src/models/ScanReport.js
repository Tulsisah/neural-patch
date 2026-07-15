const mongoose = require('mongoose');

const ScanReportSchema = new mongoose.Schema({
  repoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repo', required: true, index: true },
  status: { type: String, enum: ['pending', 'scanning', 'completed', 'failed'], default: 'pending' },
  prNumber: { type: Number, default: null },
  commitHash: { type: String },
  branch: { type: String, default: 'main' },
  vulnerabilities: [{
    severity: String,
    title: String,
    description: String,
    file: String,
    line: Number,
    codeSnippet: String,
    suggestion: String,
    githubCommentId: Number,
    isPatched: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now }
});

ScanReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ScanReport', ScanReportSchema);
