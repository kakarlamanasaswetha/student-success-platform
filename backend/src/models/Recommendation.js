const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    tips: [{ type: String }],
    source: { type: String, enum: ['openai', 'mock'], default: 'mock' },
    basedOnRiskScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recommendation', recommendationSchema);
