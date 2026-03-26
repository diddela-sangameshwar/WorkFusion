const express = require('express');
const router = express.Router();
const { logProgress, getProgress, getProgressSummary } = require('../controllers/progressController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.post('/', logProgress);
router.get('/', getProgress);
router.get('/summary/:userId', getProgressSummary);

module.exports = router;
