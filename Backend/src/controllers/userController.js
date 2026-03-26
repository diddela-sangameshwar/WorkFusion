const User = require('../models/User');

// GET /api/users — HR and Admin see all, Employee sees self
const getUsers = async (req, res, next) => {
  try {
    const { role, department, isActive, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'employee') {
      query._id = req.user._id;
    }

    if (role) query.role = role;
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
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

// GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Employees can only view themselves
    if (req.user.role === 'employee' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.',
      });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Employees can only update themselves (limited fields)
    if (req.user.role === 'employee') {
      if (req.user._id.toString() !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied.',
        });
      }
      // Employees can only update these fields
      const allowed = ['name', 'phone', 'avatar'];
      Object.keys(updates).forEach((key) => {
        if (!allowed.includes(key)) delete updates[key];
      });
    }

    // Only admin can change roles
    if (updates.role && req.user.role !== 'admin') {
      delete updates.role;
    }

    // Never allow password update through this endpoint
    delete updates.password;

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id (soft delete)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/departments
const getDepartments = async (req, res, next) => {
  try {
    const departments = await User.distinct('department');
    res.json({ success: true, data: { departments } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDepartments,
};
