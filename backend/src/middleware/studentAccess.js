const asyncHandler = require('express-async-handler');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

/**
 * Advisors/admins see the full student caseload by design (this app models a
 * shared advising pool). Instructors should only reach students enrolled in a
 * course they actually teach — without this check, any instructor account
 * could pull up any student university-wide, including confidential advisor
 * notes (wellness/financial/behavioral categories). Apply on every
 * `/students/:id/*` or `/advisor/students/:id/*` route.
 */
const restrictInstructorToOwnStudents = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'instructor') return next();

  const taughtCourseIds = await Course.find({ instructor: req.user._id }).distinct('_id');

  const hasAccess = await Enrollment.exists({
    student: req.params.id,
    course: { $in: taughtCourseIds },
  });

  if (!hasAccess) {
    res.status(403);
    throw new Error('Access denied: this student is not enrolled in any course you teach');
  }

  next();
});

module.exports = { restrictInstructorToOwnStudents };
