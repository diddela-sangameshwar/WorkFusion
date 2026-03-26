const cron = require('node-cron');
const AutomationLog = require('../models/AutomationLog');
const alertEngine = require('../services/alertEngine');
const scoringEngine = require('../services/scoringEngine');
const reportService = require('../services/reportService');

class AutomationEngine {
  constructor() {
    this.jobs = {};
  }

  /**
   * Initialize all cron jobs
   */
  init() {
    console.log('🤖 Automation Engine initializing...');

    // Every hour: Check upcoming deadlines
    this.jobs.hourlyDeadlineCheck = cron.schedule('0 * * * *', async () => {
      await this.runWorkflow('hourly-deadline-check');
    });

    // Daily at midnight: Check overdue tasks
    this.jobs.dailyOverdueCheck = cron.schedule('0 0 * * *', async () => {
      await this.runWorkflow('daily-overdue-check');
    });

    // Weekly on Sunday at midnight: Calculate productivity scores
    this.jobs.weeklyScoring = cron.schedule('0 0 * * 0', async () => {
      await this.runWorkflow('weekly-scoring');
    });

    // Monthly on 1st at midnight: Generate monthly report
    this.jobs.monthlyReport = cron.schedule('0 0 1 * *', async () => {
      await this.runWorkflow('monthly-report');
    });

    // Daily at 6 AM: Low productivity check
    this.jobs.dailyProductivityCheck = cron.schedule('0 6 * * *', async () => {
      await this.runWorkflow('daily-productivity-check');
    });

    console.log('✅ Automation Engine started with 5 scheduled workflows');
  }

  /**
   * Run a specific workflow
   */
  async runWorkflow(workflowName) {
    const log = await AutomationLog.create({
      workflowName,
      description: this._getWorkflowDescription(workflowName),
      status: 'running',
      triggeredAt: new Date(),
      triggeredBy: 'cron',
    });

    const startTime = Date.now();

    try {
      let result;

      switch (workflowName) {
        case 'hourly-deadline-check':
          result = await alertEngine.checkUpcomingDeadlines();
          break;

        case 'daily-overdue-check':
          result = await alertEngine.checkOverdueTasks();
          break;

        case 'weekly-scoring':
          result = await scoringEngine.calculateAllScores();
          break;

        case 'monthly-report':
          result = await reportService.generateReport('monthly');
          break;

        case 'daily-productivity-check':
          result = await alertEngine.checkLowProductivity();
          break;

        default:
          throw new Error(`Unknown workflow: ${workflowName}`);
      }

      const duration = Date.now() - startTime;

      await AutomationLog.findByIdAndUpdate(log._id, {
        status: 'completed',
        completedAt: new Date(),
        duration,
        result: JSON.stringify(result).substring(0, 5000),
        affectedRecords: this._countAffected(result),
      });

      console.log(`✅ Workflow "${workflowName}" completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      await AutomationLog.findByIdAndUpdate(log._id, {
        status: 'failed',
        completedAt: new Date(),
        duration,
        error: error.message,
      });

      console.error(`❌ Workflow "${workflowName}" failed: ${error.message}`);
      throw error;
    }
  }

  _getWorkflowDescription(name) {
    const descriptions = {
      'hourly-deadline-check': 'Check for tasks due within 24 hours and send reminders',
      'daily-overdue-check': 'Detect overdue tasks and create delay alerts',
      'weekly-scoring': 'Calculate productivity scores for all employees',
      'monthly-report': 'Generate monthly productivity report',
      'daily-productivity-check': 'Check for employees with low productivity scores',
    };
    return descriptions[name] || name;
  }

  _countAffected(result) {
    if (!result) return 0;
    if (Array.isArray(result)) return result.length;
    if (typeof result === 'object') {
      return result.alertsCreated || result.affectedRecords || 0;
    }
    return 0;
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    Object.values(this.jobs).forEach((job) => job.stop());
    console.log('🛑 Automation Engine stopped');
  }
}

module.exports = new AutomationEngine();
