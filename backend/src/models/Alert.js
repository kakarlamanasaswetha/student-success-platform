const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    riskScore: { type: Number, required: true },
    reasons: [{ type: String }],
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open' },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    acknowledgedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
