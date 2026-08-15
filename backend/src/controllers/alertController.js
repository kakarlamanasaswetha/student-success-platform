const asyncHandler = require('express-async-handler');
const Alert = require('../models/Alert');

// @desc  List alerts (default: open only)
// @route GET /api/alerts?status=open
// @access Private (advisor/instructor/admin)
const listAlerts = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : { status: 'open' };

  const alerts = await Alert.find(query)
    .populate('student', 'name email studentInfo')
    .sort({ severity: -1, createdAt: -1 });

  res.json({ success: true, alerts });
});

// @desc  Acknowledge an alert
// @route PATCH /api/alerts/:id/acknowledge
// @access Private (advisor/instructor/admin)
const acknowledgeAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { status: 'acknowledged', acknowledgedBy: req.user._id, acknowledgedAt: new Date() },
    { new: true }
  ).populate('student', 'name email studentInfo');

  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }

  res.json({ success: true, alert });
});

// @desc  Resolve an alert
// @route PATCH /api/alerts/:id/resolve
// @access Private (advisor/instructor/admin)
const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true }).populate(
    'student',
    'name email studentInfo'
  );

  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }

  res.json({ success: true, alert });
});

module.exports = { listAlerts, acknowledgeAlert, resolveAlert };
