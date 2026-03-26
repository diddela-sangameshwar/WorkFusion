const express = require('express');
const router = express.Router();
const { generateReport, getReports, getReportById, deleteReport } = require('../controllers/reportController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(authenticate);
router.use(authorize('hr', 'admin'));

router.post('/generate', generateReport);
router.get('/', getReports);
router.get('/:id', getReportById);
router.delete('/:id', authorize('admin'), deleteReport);

module.exports = router;
