const AutomationLog = require('../models/AutomationLog');

// GET /api/automation/logs
const getAutomationLogs = async (req, res, next) => {
  try {
    const { workflowName, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (workflowName) query.workflowName = workflowName;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await AutomationLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AutomationLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
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

// POST /api/automation/trigger/:workflow
const triggerWorkflow = async (req, res, next) => {
  try {
    const { workflow } = req.params;
    const automationEngine = require('../automation/engine');

    const result = await automationEngine.runWorkflow(workflow);

    res.json({
      success: true,
      message: `Workflow "${workflow}" triggered successfully.`,
      data: { result },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/automation/status
const getAutomationStatus = async (req, res, next) => {
  try {
    const recentLogs = await AutomationLog.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = await AutomationLog.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $count: {} },
        },
      },
    ]);

    const workflowStats = await AutomationLog.aggregate([
      {
        $group: {
          _id: '$workflowName',
          totalRuns: { $count: {} },
          lastRun: { $max: '$triggeredAt' },
          avgDuration: { $avg: '$duration' },
          failedRuns: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
        },
      },
      { $sort: { lastRun: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        recentLogs,
        stats,
        workflowStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAutomationLogs, triggerWorkflow, getAutomationStatus };
