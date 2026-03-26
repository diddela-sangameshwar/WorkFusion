const express = require('express');
const router = express.Router();
const { getAlerts, markAsRead, markAllAsRead, deleteAlert } = require('../controllers/alertController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(authenticate);

router.get('/', getAlerts);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', authorize('hr', 'admin'), deleteAlert);

module.exports = router;
