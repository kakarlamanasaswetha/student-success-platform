const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { restrictInstructorToOwnStudents } = require('../middleware/studentAccess');
const { listStudents, getStudentSummary, listNotes, addNote } = require('../controllers/advisorController');

const router = express.Router();

router.use(protect, authorize('advisor', 'instructor', 'admin'));

// listStudents intentionally returns the full caseload (shared advising pool);
// per-student routes are restricted so instructors can't reach students,
// or confidential advisor notes, outside courses they actually teach.
router.get('/students', listStudents);
router.get('/students/:id/summary', restrictInstructorToOwnStudents, getStudentSummary);
router.get('/students/:id/notes', restrictInstructorToOwnStudents, listNotes);
router.post('/students/:id/notes', restrictInstructorToOwnStudents, addNote);

module.exports = router;
