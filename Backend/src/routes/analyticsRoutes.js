const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getProductivityTrends, getDepartmentStats,
  getTaskDistribution, getTopPerformers,
} = require('../controllers/analyticsController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/productivity-trends', getProductivityTrends);
router.get('/department-stats', getDepartmentStats);
router.get('/task-distribution', getTaskDistribution);
router.get('/top-performers', getTopPerformers);

module.exports = router;
