const mongoose = require('mongoose');

const advisorNoteSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, required: true, trim: true, maxlength: 5000 },
    category: {
      type: String,
      enum: ['academic', 'attendance', 'behavioral', 'financial', 'wellness', 'general'],
      default: 'general',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdvisorNote', advisorNoteSchema);
