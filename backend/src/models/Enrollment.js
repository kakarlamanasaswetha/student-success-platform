const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    currentGrade: { type: Number, default: null, min: 0, max: 100 }, // running average %
    letterGrade: { type: String, default: '' },
    status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
