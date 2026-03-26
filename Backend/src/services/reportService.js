const Report = require('../models/Report');
const Task = require('../models/Task');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Alert = require('../models/Alert');
const { getDateRange } = require('../utils/helpers');

class ReportService {
  async generateReport(type, department, requestedBy) {
    const { start, end } = getDateRange(type);
    const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;

    // Build task query
    const taskQuery = { createdAt: { $gte: start, $lte: end } };
    if (department && department !== 'All') {
      const deptUsers = await User.find({ department }).select('_id');
      taskQuery.assignedTo = { $in: deptUsers.map((u) => u._id) };
    }

    // Gather data
    const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: 'completed' }),
      Task.countDocuments({ ...taskQuery, status: 'overdue' }),
    ]);

    // Total hours logged
    const progressQuery = { date: { $gte: start, $lte: end } };
    const hoursAgg = await Progress.aggregate([
      { $match: progressQuery },
      { $group: { _id: null, total: { $sum: '$hoursWorked' } } },
    ]);
    const totalHoursLogged = hoursAgg[0] ? Math.round(hoursAgg[0].total * 10) / 10 : 0;

    // Average productivity score
    const scoreAgg = await User.aggregate([
      { $match: { role: 'employee', isActive: true } },
      { $group: { _id: null, avg: { $avg: '$productivityScore' } } },
    ]);
    const averageScore = scoreAgg[0] ? Math.round(scoreAgg[0].avg) : 0;

    // Top performers
    const topPerformers = await User.find({
      role: 'employee',
      isActive: true,
    })
      .select('name productivityScore')
      .sort({ productivityScore: -1 })
      .limit(5);

    // Department stats
    const departmentStats = await User.aggregate([
      { $match: { role: 'employee', isActive: true } },
      {
        $group: {
          _id: '$department',
          avgScore: { $avg: '$productivityScore' },
          totalEmployees: { $count: {} },
        },
      },
    ]);

    // Alerts count
    const alertsCount = await Alert.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    const report = await Report.create({
      title,
      type,
      generatedBy: requestedBy ? 'admin' : 'system',
      department: department || 'All',
      period: { startDate: start, endDate: end },
      data: {
        totalTasks,
        completedTasks,
        overdueTasks,
        averageScore,
        totalHoursLogged,
        topPerformers: topPerformers.map((p) => ({
          userId: p._id,
          name: p.name,
          score: p.productivityScore,
        })),
        departmentStats: departmentStats.map((d) => ({
          department: d._id,
          avgScore: Math.round(d.avgScore || 0),
          totalTasks: 0,
          completionRate: 0,
        })),
        alerts: alertsCount,
      },
      status: 'completed',
    });

    return report;
  }
}

module.exports = new ReportService();
