const Progress = require('../models/Progress');
const Task = require('../models/Task');

// POST /api/progress
const logProgress = async (req, res, next) => {
  try {
    const { taskId, hoursWorked, completionPercentage, notes, blockers, mood } = req.body;

    // Verify task belongs to user
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const progress = await Progress.create({
      userId: req.user._id,
      taskId,
      date: new Date(),
      hoursWorked,
      completionPercentage,
      notes,
      blockers,
      mood,
    });

    // Update task actual hours and completion percentage
    task.actualHours = (task.actualHours || 0) + hoursWorked;
    task.completionPercentage = completionPercentage;
    if (completionPercentage >= 100 && task.status !== 'completed') {
      task.status = 'completed';
      task.completedAt = new Date();
    } else if (completionPercentage > 0 && task.status === 'pending') {
      task.status = 'in-progress';
    }
    await task.save();

    await progress.populate('taskId', 'title status');

    if (req.io) {
      req.io.emit('progress:logged', {
        userId: req.user._id,
        userName: req.user.name,
        taskTitle: task.title,
        completionPercentage,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Progress logged successfully.',
      data: { progress },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/progress
const getProgress = async (req, res, next) => {
  try {
    const { userId, taskId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};

    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    if (taskId) query.taskId = taskId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const progress = await Progress.find(query)
      .populate('userId', 'name email department')
      .populate('taskId', 'title status priority')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Progress.countDocuments(query);

    res.json({
      success: true,
      data: {
        progress,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/progress/summary/:userId
const getProgressSummary = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Employees can only view their own
    if (req.user.role === 'employee' && req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const summary = await Progress.aggregate([
      {
        $match: {
          userId: require('mongoose').Types.ObjectId.createFromHexString(userId),
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$hoursWorked' },
          totalEntries: { $count: {} },
          avgCompletionPercentage: { $avg: '$completionPercentage' },
          avgHoursPerDay: { $avg: '$hoursWorked' },
        },
      },
    ]);

    // Daily breakdown
    const dailyBreakdown = await Progress.aggregate([
      {
        $match: {
          userId: require('mongoose').Types.ObjectId.createFromHexString(userId),
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          hoursWorked: { $sum: '$hoursWorked' },
          entries: { $count: {} },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: summary[0] || {
          totalHours: 0,
          totalEntries: 0,
          avgCompletionPercentage: 0,
          avgHoursPerDay: 0,
        },
        dailyBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { logProgress, getProgress, getProgressSummary };
