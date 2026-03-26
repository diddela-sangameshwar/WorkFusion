const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    hoursWorked: {
      type: Number,
      required: [true, 'Hours worked is required'],
      min: 0.25,
      max: 24,
    },
    completionPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    blockers: {
      type: String,
      trim: true,
      default: '',
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'neutral', 'struggling', 'blocked'],
      default: 'neutral',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one entry per user-task-date
progressSchema.index({ userId: 1, taskId: 1, date: 1 });
progressSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Progress', progressSchema);
