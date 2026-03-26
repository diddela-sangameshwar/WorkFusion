const Report = require('../models/Report');
const { getDateRange } = require('../utils/helpers');
const reportService = require('../services/reportService');

// POST /api/reports/generate
const generateReport = async (req, res, next) => {
  try {
    const { type = 'weekly', department } = req.body;
    const report = await reportService.generateReport(type, department, req.user);

    res.status(201).json({
      success: true,
      message: `${type} report generated successfully.`,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports
const getReports = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reports = await Report.find(query)
      .populate('generatedFor', 'name email')
      .populate('data.topPerformers.userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: {
        reports,
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

// GET /api/reports/:id
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('data.topPerformers.userId', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    res.json({ success: true, data: { report } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reports/:id
const deleteReport = async (req, res, next) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Report deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateReport, getReports, getReportById, deleteReport };
