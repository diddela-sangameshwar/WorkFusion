const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    generatedBy: {
      type: String,
      enum: ['system', 'hr', 'admin'],
      default: 'system',
    },
    generatedFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    department: {
      type: String,
      default: 'All',
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    data: {
      totalTasks: { type: Number, default: 0 },
      completedTasks: { type: Number, default: 0 },
      overdueTasks: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      totalHoursLogged: { type: Number, default: 0 },
      topPerformers: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: String,
          score: Number,
        },
      ],
      departmentStats: [
        {
          department: String,
          avgScore: Number,
          totalTasks: Number,
          completionRate: Number,
        },
      ],
      alerts: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['generating', 'completed', 'failed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
