const asyncHandler = require('express-async-handler');
const ChatMessage = require('../models/ChatMessage');
const { chatReply, isLiveMode } = require('../services/openaiService');
const { computeRiskForStudent } = require('../services/riskScoreService');

const MAX_MESSAGE_LENGTH = 4000;

// @desc  Send a message to the academic assistant chatbot
// @route POST /api/ai/chat
// @access Private
const sendChatMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (typeof message !== 'string' || !message.trim()) {
    res.status(400);
    throw new Error('Message is required');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400);
    throw new Error(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`);
  }

  const history = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
  const orderedHistory = history.reverse().map((m) => ({ role: m.role, content: m.content }));

  let context = { role: req.user.role, name: req.user.name };
  if (req.user.role === 'student') {
    const risk = await computeRiskForStudent(req.user._id);
    context = { ...context, riskLevel: risk.riskLevel, ...risk.breakdown };
  }

  const { reply, source } = await chatReply(message.trim(), orderedHistory, context);

  await ChatMessage.create([
    { user: req.user._id, role: 'user', content: message.trim() },
    { user: req.user._id, role: 'assistant', content: reply },
  ]);

  res.json({ success: true, reply, source });
});

// @desc  Get chat history for the current user
// @route GET /api/ai/chat/history
// @access Private
const getChatHistory = asyncHandler(async (req, res) => {
  const history = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: 1 }).limit(100);
  res.json({ success: true, history });
});

// @desc  Report whether the server is running with a live OpenAI key or in demo/mock mode
// @route GET /api/ai/status
// @access Private
const getAIStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, mode: isLiveMode() ? 'live' : 'demo' });
});

module.exports = { sendChatMessage, getChatHistory, getAIStatus };
