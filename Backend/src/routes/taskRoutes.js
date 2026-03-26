const express = require('express');
const router = express.Router();
const {
  createTask, getTasks, getTaskById, updateTask,
  updateTaskStatus, deleteTask, addComment,
} = require('../controllers/taskController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(authenticate);

router.post('/', authorize('hr', 'admin'), createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', authorize('admin'), deleteTask);
router.post('/:id/comments', addComment);

module.exports = router;
