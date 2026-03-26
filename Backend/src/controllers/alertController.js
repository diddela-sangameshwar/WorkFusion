const Alert = require('../models/Alert');

// GET /api/alerts
const getAlerts = async (req, res, next) => {
  try {
    const { type, severity, isRead, page = 1, limit = 20 } = req.query;
    const query = {};

    // Employees see only their own alerts
    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    }

    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const alerts = await Alert.find(query)
      .populate('userId', 'name email')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(query);
    const unreadCount = await Alert.countDocuments({
      ...query,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        alerts,
        unreadCount,
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

// PATCH /api/alerts/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    res.json({ success: true, data: { alert } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/alerts/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    const query = req.user.role === 'employee'
      ? { userId: req.user._id, isRead: false }
      : { isRead: false };

    await Alert.updateMany(query, { isRead: true });

    res.json({ success: true, message: 'All alerts marked as read.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/alerts/:id
const deleteAlert = async (req, res, next) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Alert deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAlerts, markAsRead, markAllAsRead, deleteAlert };
