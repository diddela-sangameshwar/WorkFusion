const Task = require('../models/Task');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Alert = require('../models/Alert');

// GET /api/analytics/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    }

    const [totalTasks, completedTasks, inProgressTasks, overdueTasks] = await Promise.all([
      Task.countDocuments(query),
      Task.countDocuments({ ...query, status: 'completed' }),
      Task.countDocuments({ ...query, status: 'in-progress' }),
      Task.countDocuments({ ...query, status: 'overdue' }),
    ]);

    const pendingTasks = totalTasks - completedTasks - inProgressTasks - overdueTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // User-specific or global stats
    let avgScore = 0;
    let activeAlerts = 0;
    let totalEmployees = 0;

    if (req.user.role === 'employee') {
      const user = await User.findById(req.user._id);
      avgScore = user.productivityScore || 0;
      activeAlerts = await Alert.countDocuments({ userId: req.user._id, isRead: false });
    } else {
      const scoreAgg = await User.aggregate([
        { $match: { role: 'employee', isActive: true } },
        { $group: { _id: null, avgScore: { $avg: '$productivityScore' } } },
      ]);
      avgScore = scoreAgg[0] ? Math.round(scoreAgg[0].avgScore) : 0;
      activeAlerts = await Alert.countDocuments({ isRead: false });
      totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });
    }

    res.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        pendingTasks,
        completionRate,
        avgScore,
        activeAlerts,
        totalEmployees,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/productivity-trends
const getProductivityTrends = async (req, res, next) => {
  try {
    const { period = '30', userId } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const matchQuery = { date: { $gte: daysAgo } };
    if (req.user.role === 'employee') {
      matchQuery.userId = req.user._id;
    } else if (userId) {
      matchQuery.userId = require('mongoose').Types.ObjectId.createFromHexString(userId);
    }

    const trends = await Progress.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalHours: { $sum: '$hoursWorked' },
          avgCompletion: { $avg: '$completionPercentage' },
          entries: { $count: {} },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: { trends } });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/department-stats
const getDepartmentStats = async (req, res, next) => {
  try {
    const stats = await User.aggregate([
      { $match: { role: 'employee', isActive: true } },
      {
        $group: {
          _id: '$department',
          totalEmployees: { $count: {} },
          avgScore: { $avg: '$productivityScore' },
        },
      },
      { $sort: { avgScore: -1 } },
    ]);

    // Get task stats per department
    const deptTaskStats = await Task.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.department',
          totalTasks: { $count: {} },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
    ]);

    const merged = stats.map((dept) => {
      const taskData = deptTaskStats.find((t) => t._id === dept._id) || {
        totalTasks: 0,
        completedTasks: 0,
      };
      return {
        department: dept._id,
        totalEmployees: dept.totalEmployees,
        avgScore: Math.round(dept.avgScore || 0),
        totalTasks: taskData.totalTasks,
        completedTasks: taskData.completedTasks,
        completionRate: taskData.totalTasks > 0
          ? Math.round((taskData.completedTasks / taskData.totalTasks) * 100)
          : 0,
      };
    });

    res.json({ success: true, data: { departments: merged } });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/task-distribution
const getTaskDistribution = async (req, res, next) => {
  try {
    const matchQuery = {};
    if (req.user.role === 'employee') {
      matchQuery.assignedTo = req.user._id;
    }

    const distribution = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $count: {} },
        },
      },
    ]);

    const priorityDistribution = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$priority',
          count: { $count: {} },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        statusDistribution: distribution,
        priorityDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/top-performers
const getTopPerformers = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const topPerformers = await User.find({
      role: 'employee',
      isActive: true,
    })
      .select('name email department productivityScore')
      .sort({ productivityScore: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: { topPerformers } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getProductivityTrends,
  getDepartmentStats,
  getTaskDistribution,
  getTopPerformers,
};
