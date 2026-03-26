module.exports = {
  ROLES: {
    EMPLOYEE: 'employee',
    HR: 'hr',
    ADMIN: 'admin',
  },
  TASK_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    OVERDUE: 'overdue',
  },
  TASK_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
  ALERT_TYPES: {
    DELAY: 'delay',
    LOW_PRODUCTIVITY: 'low-productivity',
    MILESTONE: 'milestone',
    REMINDER: 'reminder',
  },
  ALERT_SEVERITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
  REPORT_TYPES: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
  },
  SCORING: {
    TASK_COMPLETION_WEIGHT: 40,
    ON_TIME_WEIGHT: 30,
    QUALITY_WEIGHT: 20,
    CONSISTENCY_WEIGHT: 10,
    LOW_SCORE_THRESHOLD: 40,
  },
};
