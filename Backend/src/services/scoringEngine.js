const Task = require('../models/Task');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { SCORING } = require('../config/constants');

class ScoringEngine {
  /**
   * Calculate productivity score for a user
   * Formula: (taskCompletionRate × 40) + (onTimeRate × 30) + (qualityFactor × 20) + (consistencyBonus × 10)
   */
  async calculateScore(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get tasks for this period
    const tasks = await Task.find({
      assignedTo: userId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    if (tasks.length === 0) {
      return { score: 0, breakdown: this._emptyBreakdown(), trend: 'stable' };
    }

    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const totalTasks = tasks.length;

    // 1. Task Completion Rate (40%)
    const taskCompletionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0;
    const completionScore = taskCompletionRate * SCORING.TASK_COMPLETION_WEIGHT;

    // 2. On-time Rate (30%)
    const onTimeTasks = completedTasks.filter((t) => {
      return t.completedAt && t.dueDate && t.completedAt <= t.dueDate;
    });
    const onTimeRate = completedTasks.length > 0 ? onTimeTasks.length / completedTasks.length : 0;
    const onTimeScore = onTimeRate * SCORING.ON_TIME_WEIGHT;

    // 3. Quality Factor - estimated vs actual hours efficiency (20%)
    const qualityFactor = this._calculateQualityFactor(completedTasks);
    const qualityScore = qualityFactor * SCORING.QUALITY_WEIGHT;

    // 4. Consistency Bonus - daily progress logging streak (10%)
    const consistencyBonus = await this._calculateConsistency(userId, thirtyDaysAgo);
    const consistencyScore = consistencyBonus * SCORING.CONSISTENCY_WEIGHT;

    const totalScore = Math.round(
      Math.min(100, completionScore + onTimeScore + qualityScore + consistencyScore)
    );

    // Calculate trend
    const trend = await this._calculateTrend(userId);

    // Update user's productivityScore
    await User.findByIdAndUpdate(userId, { productivityScore: totalScore });

    return {
      score: totalScore,
      breakdown: {
        taskCompletion: { rate: Math.round(taskCompletionRate * 100), score: Math.round(completionScore) },
        onTimeDelivery: { rate: Math.round(onTimeRate * 100), score: Math.round(onTimeScore) },
        quality: { factor: Math.round(qualityFactor * 100), score: Math.round(qualityScore) },
        consistency: { factor: Math.round(consistencyBonus * 100), score: Math.round(consistencyScore) },
      },
      trend,
      totalTasks,
      completedTasks: completedTasks.length,
      onTimeTasks: onTimeTasks.length,
    };
  }

  /**
   * Calculate quality based on estimated vs actual hours
   * If actual <= estimated: high quality (efficient)
   * If actual > estimated: quality decreases
   */
  _calculateQualityFactor(completedTasks) {
    if (completedTasks.length === 0) return 0;

    let totalEfficiency = 0;
    let validTasks = 0;

    for (const task of completedTasks) {
      if (task.estimatedHours > 0 && task.actualHours > 0) {
        const efficiency = Math.min(1, task.estimatedHours / task.actualHours);
        totalEfficiency += efficiency;
        validTasks++;
      }
    }

    return validTasks > 0 ? totalEfficiency / validTasks : 0.5;
  }

  /**
   * Calculate consistency based on progress logging frequency
   */
  async _calculateConsistency(userId, since) {
    const progressEntries = await Progress.find({
      userId,
      date: { $gte: since },
    });

    const uniqueDays = new Set(
      progressEntries.map((p) => p.date.toISOString().split('T')[0])
    );

    // Working days in 30 days ~22
    const expectedWorkingDays = 22;
    return Math.min(1, uniqueDays.size / expectedWorkingDays);
  }

  /**
   * Predict score trend based on last 4 weekly averages
   */
  async _calculateTrend(userId) {
    const now = new Date();
    const weeklyScores = [];

    for (let i = 0; i < 4; i++) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      const tasks = await Task.find({
        assignedTo: userId,
        createdAt: { $gte: weekStart, $lte: weekEnd },
      });

      const completed = tasks.filter((t) => t.status === 'completed').length;
      const total = tasks.length;
      weeklyScores.push(total > 0 ? (completed / total) * 100 : 0);
    }

    // Simple linear regression
    if (weeklyScores.length < 2) return 'stable';

    const recentAvg = (weeklyScores[0] + weeklyScores[1]) / 2;
    const olderAvg = (weeklyScores[2] + weeklyScores[3]) / 2;

    if (recentAvg > olderAvg + 5) return 'improving';
    if (recentAvg < olderAvg - 5) return 'declining';
    return 'stable';
  }

  /**
   * Predict next period score
   */
  async predictScore(userId) {
    const current = await this.calculateScore(userId);
    const trendFactor =
      current.trend === 'improving' ? 1.05 :
      current.trend === 'declining' ? 0.95 : 1.0;

    return {
      currentScore: current.score,
      predictedScore: Math.min(100, Math.round(current.score * trendFactor)),
      trend: current.trend,
      breakdown: current.breakdown,
    };
  }

  /**
   * Calculate scores for all active employees
   */
  async calculateAllScores() {
    const employees = await User.find({ role: 'employee', isActive: true });
    const results = [];

    for (const emp of employees) {
      const result = await this.calculateScore(emp._id);
      results.push({
        userId: emp._id,
        name: emp.name,
        department: emp.department,
        ...result,
      });
    }

    return results;
  }

  _emptyBreakdown() {
    return {
      taskCompletion: { rate: 0, score: 0 },
      onTimeDelivery: { rate: 0, score: 0 },
      quality: { factor: 0, score: 0 },
      consistency: { factor: 0, score: 0 },
    };
  }
}

module.exports = new ScoringEngine();
