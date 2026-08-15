const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const AdvisorNote = require('../models/AdvisorNote');
const { computeRiskForStudent } = require('../services/riskScoreService');
const { summarizePerformance } = require('../services/openaiService');
const escapeRegex = require('../utils/escapeRegex');

const MAX_SEARCH_LENGTH = 100;

// @desc  List students with current risk info, optionally filtered. Advisors/admins
//        see the full caseload; instructors are scoped to students enrolled in a
//        course they teach (an instructor calling this directly should not be able
//        to pull a university-wide roster just because the endpoint is shared).
// @route GET /api/advisor/students?risk=high&search=jane
// @access Private (advisor/instructor/admin)
const listStudents = asyncHandler(async (req, res) => {
  const { risk, search } = req.query;

  const query = { role: 'student' };
  if (risk && ['low', 'medium', 'high'].includes(risk)) {
    query['studentInfo.riskLevel'] = risk;
  }
  if (search) {
    if (typeof search !== 'string') {
      res.status(400);
      throw new Error('Invalid search parameter');
    }
    const safeSearch = escapeRegex(search.slice(0, MAX_SEARCH_LENGTH));
    query.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  if (req.user.role === 'instructor') {
    const taughtCourseIds = await Course.find({ instructor: req.user._id }).distinct('_id');
    const ownStudentIds = await Enrollment.find({ course: { $in: taughtCourseIds } }).distinct('student');
    query._id = { $in: ownStudentIds };
  }

  const students = await User.find(query).sort({ 'studentInfo.riskScore': -1 });

  const summary = {
    total: students.length,
    high: students.filter((s) => s.studentInfo?.riskLevel === 'high').length,
    medium: students.filter((s) => s.studentInfo?.riskLevel === 'medium').length,
    low: students.filter((s) => s.studentInfo?.riskLevel === 'low').length,
  };

  res.json({ success: true, students: students.map((s) => s.toSafeObject()), summary });
});

// @desc  Get AI-generated plain-language summary of a student's performance
// @route GET /api/advisor/students/:id/summary
// @access Private (advisor/instructor/admin)
const getStudentSummary = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }

  const riskData = await computeRiskForStudent(student._id);
  const result = await summarizePerformance({ name: student.name, ...riskData });

  res.json({ success: true, ...result, risk: riskData });
});

// @desc  List advisor notes for a student
// @route GET /api/advisor/students/:id/notes
// @access Private (advisor/instructor/admin)
const listNotes = asyncHandler(async (req, res) => {
  const notes = await AdvisorNote.find({ student: req.params.id })
    .populate('author', 'name role')
    .sort({ createdAt: -1 });
  res.json({ success: true, notes });
});

// @desc  Add an advisor note for a student
// @route POST /api/advisor/students/:id/notes
// @access Private (advisor/instructor/admin)
const addNote = asyncHandler(async (req, res) => {
  const { note, category } = req.body;
  if (typeof note !== 'string' || !note.trim()) {
    res.status(400);
    throw new Error('Note text is required');
  }

  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }

  const created = await AdvisorNote.create({
    student: req.params.id,
    author: req.user._id,
    note: note.trim(),
    category: category || 'general',
  });

  const populated = await created.populate('author', 'name role');
  res.status(201).json({ success: true, note: populated });
});

module.exports = { listStudents, getStudentSummary, listNotes, addNote };
