const express = require('express');
const { protect } = require('../middleware/auth');
const { sendChatMessage, getChatHistory, getAIStatus } = require('../controllers/aiController');

const router = express.Router();

router.use(protect);

router.get('/status', getAIStatus);
router.post('/chat', sendChatMessage);
router.get('/chat/history', getChatHistory);

module.exports = router;
