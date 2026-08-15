const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { listAlerts, acknowledgeAlert, resolveAlert } = require('../controllers/alertController');

const router = express.Router();

router.use(protect, authorize('advisor', 'instructor', 'admin'));

router.get('/', listAlerts);
router.patch('/:id/acknowledge', acknowledgeAlert);
router.patch('/:id/resolve', resolveAlert);

module.exports = router;
