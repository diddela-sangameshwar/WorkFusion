const mongoose = require('mongoose');

const automationLogSchema = new mongoose.Schema(
  {
    workflowName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      default: 'running',
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    duration: {
      type: Number, // milliseconds
      default: 0,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    error: {
      type: String,
      default: '',
    },
    affectedRecords: {
      type: Number,
      default: 0,
    },
    triggeredBy: {
      type: String,
      enum: ['cron', 'manual', 'event'],
      default: 'cron',
    },
  },
  {
    timestamps: true,
  }
);

automationLogSchema.index({ workflowName: 1, createdAt: -1 });

module.exports = mongoose.model('AutomationLog', automationLogSchema);
