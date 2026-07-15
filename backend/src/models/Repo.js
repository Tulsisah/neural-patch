const mongoose = require('mongoose');

const RepoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: String, required: true },
  url: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  healthScore: { type: Number, default: 100 },
  lastScanDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

RepoSchema.index({ name: 1, owner: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Repo', RepoSchema);
