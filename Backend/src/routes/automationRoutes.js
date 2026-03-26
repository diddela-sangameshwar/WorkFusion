const express = require('express');
const router = express.Router();
const { getAutomationLogs, triggerWorkflow, getAutomationStatus } = require('../controllers/automationController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/logs', getAutomationLogs);
router.get('/status', getAutomationStatus);
router.post('/trigger/:workflow', triggerWorkflow);

module.exports = router;
