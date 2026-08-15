const asyncHandler = require('express-async-handler');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Submission = require('../models/Submission');
const AttendanceRecord = require('../models/AttendanceRecord');

// @desc  List courses (instructor sees own courses; advisor/admin see all)
// @route GET /api/courses
// @access Private (instructor/advisor/admin)
const listCourses = asyncHandler(async (req, res) => {
  const query = req.user.role === 'instructor' ? { instructor: req.user._id } : {};
  const courses = await Course.find(query).populate('instructor', 'name email').sort({ term: -1, code: 1 });
  res.json({ success: true, courses });
});

// @desc  Get a course roster with per-student grade, attendance, completion snapshot
// @route GET /api/courses/:id/roster
// @access Private (instructor/advisor/admin)
const getRoster = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (req.user.role === 'instructor' && String(course.instructor) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You do not teach this course');
  }

  const enrollments = await Enrollment.find({ course: course._id, status: 'active' }).populate(
    'student',
    'name email studentInfo'
  );

  const roster = await Promise.all(
    enrollments.map(async (e) => {
      const subs = await Submission.find({ course: course._id, student: e.student._id }).populate('assignment', 'dueDate');
      const attendance = await AttendanceRecord.find({ course: course._id, student: e.student._id });

      const pastDue = subs.filter((s) => s.assignment && new Date(s.assignment.dueDate) <= new Date());
      const missing = pastDue.filter((s) => s.status === 'missing').length;
      const completionRate = pastDue.length ? Math.round(((pastDue.length - missing) / pastDue.length) * 100) : 100;

      const absences = attendance.filter((a) => a.status === 'absent').length;
      const attendanceRate = attendance.length
        ? Math.round(((attendance.length - absences) / attendance.length) * 100)
        : 100;

      return {
        student: e.student,
        currentGrade: e.currentGrade,
        completionRate,
        attendanceRate,
        missingAssignments: missing,
        riskLevel: e.student.studentInfo?.riskLevel || 'low',
        riskScore: e.student.studentInfo?.riskScore || 0,
      };
    })
  );

  res.json({ success: true, course, roster });
});

module.exports = { listCourses, getRoster };
