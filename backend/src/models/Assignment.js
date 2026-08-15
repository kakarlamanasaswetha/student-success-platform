const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['homework', 'quiz', 'exam', 'project', 'lab'],
      default: 'homework',
    },
    maxScore: { type: Number, default: 100 },
    dueDate: { type: Date, required: true },
    weight: { type: Number, default: 1 }, // relative weight in grade calc
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
