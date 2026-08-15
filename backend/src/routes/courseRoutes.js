const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { listCourses, getRoster } = require('../controllers/courseController');

const router = express.Router();

router.use(protect, authorize('instructor', 'advisor', 'admin'));

router.get('/', listCourses);
router.get('/:id/roster', getRoster);

module.exports = router;
