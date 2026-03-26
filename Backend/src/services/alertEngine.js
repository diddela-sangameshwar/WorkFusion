const Task = require('../models/Task');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { SCORING } = require('../config/constants');

class AlertEngine {
  /**
   * Check for overdue tasks and create delay alerts
   */
  async checkOverdueTasks() {
    const now = new Date();
    const overdueTasks = await Task.find({
      dueDate: { $lt: now },
      status: { $in: ['pending', 'in-progress'] },
    }).populate('assignedTo', 'name email');

    let alertsCreated = 0;

    for (const task of overdueTasks) {
      // Update task status to overdue
      task.status = 'overdue';
      await task.save();

      // Check if alert already exists for this task today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingAlert = await Alert.findOne({
        taskId: task._id,
        type: 'delay',
        createdAt: { $gte: today },
      });

      if (!existingAlert) {
        const daysOverdue = Math.ceil((now - task.dueDate) / (1000 * 60 * 60 * 24));
        const severity = daysOverdue > 7 ? 'critical' : daysOverdue > 3 ? 'high' : 'medium';

        await Alert.create({
          userId: task.assignedTo._id,
          taskId: task._id,
          type: 'delay',
          severity,
          title: 'Task Overdue',
          message: `Task "${task.title}" is ${daysOverdue} day(s) overdue. Please update status or complete the task.`,
          triggeredBy: 'automation',
          metadata: { daysOverdue, dueDate: task.dueDate },
        });

        alertsCreated++;
      }
    }

    return { overdueTasks: overdueTasks.length, alertsCreated };
  }

  /**
   * Check for tasks due within 24 hours and send reminders
   */
  async checkUpcomingDeadlines() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingTasks = await Task.find({
      dueDate: { $gte: now, $lte: tomorrow },
      status: { $in: ['pending', 'in-progress'] },
    }).populate('assignedTo', 'name email');

    let alertsCreated = 0;

    for (const task of upcomingTasks) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingAlert = await Alert.findOne({
        taskId: task._id,
        type: 'reminder',
        createdAt: { $gte: today },
      });

      if (!existingAlert) {
        const hoursLeft = Math.ceil((task.dueDate - now) / (1000 * 60 * 60));

        await Alert.create({
          userId: task.assignedTo._id,
          taskId: task._id,
          type: 'reminder',
          severity: 'medium',
          title: 'Upcoming Deadline',
          message: `Task "${task.title}" is due in ${hoursLeft} hours. Current completion: ${task.completionPercentage}%.`,
          triggeredBy: 'automation',
          metadata: { hoursLeft, dueDate: task.dueDate },
        });

        alertsCreated++;
      }
    }

    return { upcomingTasks: upcomingTasks.length, alertsCreated };
  }

  /**
   * Check for low productivity scores
   */
  async checkLowProductivity() {
    const lowScoreUsers = await User.find({
      role: 'employee',
      isActive: true,
      productivityScore: { $gt: 0, $lt: SCORING.LOW_SCORE_THRESHOLD },
    });

    let alertsCreated = 0;

    for (const user of lowScoreUsers) {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const existingAlert = await Alert.findOne({
        userId: user._id,
        type: 'low-productivity',
        createdAt: { $gte: lastWeek },
      });

      if (!existingAlert) {
        await Alert.create({
          userId: user._id,
          type: 'low-productivity',
          severity: user.productivityScore < 20 ? 'critical' : 'high',
          title: 'Low Productivity Score',
          message: `Productivity score is ${user.productivityScore}/100. Please review your tasks and progress.`,
          triggeredBy: 'automation',
          metadata: { score: user.productivityScore },
        });

        alertsCreated++;
      }
    }

    return { lowScoreUsers: lowScoreUsers.length, alertsCreated };
  }

  /**
   * Create milestone alerts for task completion milestones
   */
  async checkMilestones(taskId, completionPercentage) {
    const milestones = [25, 50, 75, 100];
    const task = await Task.findById(taskId);
    if (!task) return;

    for (const milestone of milestones) {
      if (completionPercentage >= milestone) {
        const existingAlert = await Alert.findOne({
          taskId,
          type: 'milestone',
          'metadata.milestone': milestone,
        });

        if (!existingAlert) {
          await Alert.create({
            userId: task.assignedTo,
            taskId,
            type: 'milestone',
            severity: 'low',
            title: `${milestone}% Milestone Reached`,
            message: `Task "${task.title}" has reached ${milestone}% completion!`,
            triggeredBy: 'system',
            metadata: { milestone },
          });
        }
      }
    }
  }
}

module.exports = new AlertEngine();
