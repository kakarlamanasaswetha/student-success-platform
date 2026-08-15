const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Submission = require('../models/Submission');
const AttendanceRecord = require('../models/AttendanceRecord');
const Recommendation = require('../models/Recommendation');
const { computeRiskForStudent } = require('../services/riskScoreService');
const { evaluateAndAlert } = require('../services/alertService');
const { generateStudyRecommendation } = require('../services/openaiService');

const resolveStudentId = (req) => req.params.id || req.user._id;

// @desc  Get a student's full dashboard payload (profile, courses, risk, alerts context)
// @route GET /api/students/me/dashboard  (or /api/students/:id/dashboard for advisor/instructor)
// @access Private
const getDashboard = asyncHandler(async (req, res) => {
  const studentId = resolveStudentId(req);

  const student = await User.findById(studentId);
  if (!student || student.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }

  const enrollments = await Enrollment.find({ student: studentId, status: 'active' }).populate(
    'course',
    'code title term credits instructor'
  );

  const submissions = await Submission.find({ student: studentId }).populate('assignment', 'title dueDate maxScore type');
  const attendance = await AttendanceRecord.find({ student: studentId }).sort({ date: 1 });

  const riskData = await computeRiskForStudent(studentId);

  const upcoming = submissions
    .filter((s) => s.status === 'missing' && s.assignment && new Date(s.assignment.dueDate) >= new Date())
    .sort((a, b) => new Date(a.assignment.dueDate) - new Date(b.assignment.dueDate))
    .slice(0, 5);

  const overdue = submissions.filter(
    (s) => s.status === 'missing' && s.assignment && new Date(s.assignment.dueDate) < new Date()
  );

  res.json({
    success: true,
    student: student.toSafeObject(),
    enrollments,
    risk: riskData,
    stats: {
      totalCourses: enrollments.length,
      upcomingAssignments: upcoming,
      overdueCount: overdue.length,
      totalAttendanceRecords: attendance.length,
    },
  });
});

// @desc  Chart-ready academic progress data (grade trend, attendance trend, completion by course)
// @route GET /api/students/me/progress
// @access Private
const getProgress = asyncHandler(async (req, res) => {
  const studentId = resolveStudentId(req);

  const enrollments = await Enrollment.find({ student: studentId }).populate('course', 'code title');
  const submissions = await Submission.find({ student: studentId }).populate('assignment', 'title dueDate maxScore course');
  const attendance = await AttendanceRecord.find({ student: studentId }).sort({ date: 1 });

  // Grade trend: chronological list of scored submissions as % of max score
  const gradeTrend = submissions
    .filter((s) => typeof s.score === 'number' && s.assignment)
    .map((s) => ({
      label: s.assignment.title,
      date: s.assignment.dueDate,
      percent: Math.round((s.score / s.assignment.maxScore) * 100),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Attendance trend: rolling weekly attendance rate
  const weekMap = new Map();
  attendance.forEach((a) => {
    const d = new Date(a.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (!weekMap.has(key)) weekMap.set(key, { present: 0, total: 0 });
    const entry = weekMap.get(key);
    entry.total += 1;
    if (a.status === 'present' || a.status === 'excused') entry.present += 1;
  });
  const attendanceTrend = Array.from(weekMap.entries())
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([week, v]) => ({ week, rate: Math.round((v.present / v.total) * 100) }));

  // Completion + current grade by course
  const byCourse = enrollments.map((e) => {
    const courseSubs = submissions.filter((s) => s.assignment && String(s.assignment.course) === String(e.course._id));
    const total = courseSubs.length;
    const completed = courseSubs.filter((s) => s.status !== 'missing').length;
    return {
      courseId: e.course._id,
      courseCode: e.course.code,
      courseTitle: e.course.title,
      currentGrade: e.currentGrade,
      completionRate: total ? Math.round((completed / total) * 100) : 100,
    };
  });

  res.json({ success: true, gradeTrend, attendanceTrend, byCourse });
});

// @desc  Get latest AI recommendation, generating one if none exists or force=true
// @route GET /api/students/me/recommendations
// @access Private
const getRecommendations = asyncHandler(async (req, res) => {
  const studentId = resolveStudentId(req);
  const force = req.query.refresh === 'true';

  let latest = force ? null : await Recommendation.findOne({ student: studentId }).sort({ createdAt: -1 });

  if (!latest) {
    const student = await User.findById(studentId);
    const riskData = await computeRiskForStudent(studentId);
    const ai = await generateStudyRecommendation({ name: student.name, ...riskData });

    latest = await Recommendation.create({
      student: studentId,
      content: ai.content,
      tips: ai.tips,
      source: ai.source,
      basedOnRiskScore: riskData.riskScore,
    });
  }

  const history = await Recommendation.find({ student: studentId }).sort({ createdAt: -1 }).limit(5);

  res.json({ success: true, latest, history });
});

// @desc  Recalculate a student's risk score and trigger alert evaluation
// @route POST /api/students/:id/recalculate-risk
// @access Private (advisor/instructor/admin)
const recalculateRisk = asyncHandler(async (req, res) => {
  const studentId = resolveStudentId(req);
  const result = await evaluateAndAlert(studentId);
  res.json({ success: true, ...result });
});

module.exports = { getDashboard, getProgress, getRecommendations, recalculateRisk };
