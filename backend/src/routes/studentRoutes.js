const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { restrictInstructorToOwnStudents } = require('../middleware/studentAccess');
const {
  getDashboard,
  getProgress,
  getRecommendations,
  recalculateRisk,
} = require('../controllers/studentController');

const router = express.Router();

// Student's own data
router.get('/me/dashboard', protect, authorize('student'), getDashboard);
router.get('/me/progress', protect, authorize('student'), getProgress);
router.get('/me/recommendations', protect, authorize('student'), getRecommendations);

// Advisor/instructor viewing a specific student — instructors are restricted to
// students enrolled in a course they teach; advisors/admins keep full caseload access.
router.get('/:id/dashboard', protect, authorize('advisor', 'instructor', 'admin'), restrictInstructorToOwnStudents, getDashboard);
router.get('/:id/progress', protect, authorize('advisor', 'instructor', 'admin'), restrictInstructorToOwnStudents, getProgress);
router.get(
  '/:id/recommendations',
  protect,
  authorize('advisor', 'instructor', 'admin'),
  restrictInstructorToOwnStudents,
  getRecommendations
);
router.post(
  '/:id/recalculate-risk',
  protect,
  authorize('advisor', 'instructor', 'admin'),
  restrictInstructorToOwnStudents,
  recalculateRisk
);

module.exports = router;
