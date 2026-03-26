const Task = require('../models/Task');
const Alert = require('../models/Alert');

// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const taskData = {
      ...req.body,
      assignedBy: req.user._id,
    };

    const task = await Task.create(taskData);
    await task.populate('assignedTo', 'name email department');
    await task.populate('assignedBy', 'name email');

    // Emit socket event
    if (req.io) {
      req.io.to(`user_${task.assignedTo._id}`).emit('task:created', task);
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, assignedTo, search, page = 1, limit = 20 } = req.query;
    const query = {};

    // Scope by role
    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      data: {
        tasks,
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

// GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name email')
      .populate('comments.user', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Employees can only view their own tasks
    if (req.user.role === 'employee' && task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Employees can only update their own tasks (limited fields)
    if (req.user.role === 'employee') {
      if (task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      const allowed = ['status', 'actualHours', 'completionPercentage', 'comments'];
      Object.keys(req.body).forEach((key) => {
        if (!allowed.includes(key)) delete req.body[key];
      });
    }

    // Auto-set completedAt
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = new Date();
      req.body.completionPercentage = 100;

      // Create milestone alert
      await Alert.create({
        userId: task.assignedTo,
        taskId: task._id,
        type: 'milestone',
        severity: 'low',
        title: 'Task Completed',
        message: `Task "${task.title}" has been completed.`,
        triggeredBy: 'system',
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name email');

    // Emit socket event
    if (req.io) {
      req.io.to(`user_${updatedTask.assignedTo._id}`).emit('task:updated', updatedTask);
      req.io.emit('task:statusChanged', {
        taskId: updatedTask._id,
        status: updatedTask.status,
        title: updatedTask.title,
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully.',
      data: { task: updatedTask },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
      task.completionPercentage = 100;
    }

    await task.save();
    await task.populate('assignedTo', 'name email department');

    if (req.io) {
      req.io.emit('task:statusChanged', {
        taskId: task._id,
        status: task.status,
        title: task.title,
      });
    }

    res.json({
      success: true,
      message: 'Task status updated.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks/:id/comments
const addComment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    task.comments.push({
      user: req.user._id,
      text: req.body.text,
    });

    await task.save();
    await task.populate('comments.user', 'name email');

    res.json({
      success: true,
      message: 'Comment added.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
};
