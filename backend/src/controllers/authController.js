const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc Register a new user
// @route POST /api/auth/register
// @access Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, major, year, department, title } = req.body;

  // express-mongo-sanitize strips $/. keys, but explicit type checks here are the
  // difference between a clean 400 and an object silently reaching a bcrypt/query
  // call it wasn't written to expect (e.g. {"email": {"toLowerCase": ...}} shaped input).
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    res.status(400);
    throw new Error('Name, email, and password must be strings');
  }
  if (!name.trim() || !email.trim() || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const allowedRoles = ['student', 'advisor', 'instructor'];
  const finalRole = allowedRoles.includes(role) ? role : 'student';

  const user = await User.create({
    name,
    email,
    password,
    role: finalRole,
    studentInfo: finalRole === 'student' ? { major: major || '', year: year || '' } : undefined,
    staffInfo: finalRole !== 'student' ? { department: department || '', title: title || '' } : undefined,
  });

  res.status(201).json({
    success: true,
    token: generateToken(user),
    user: user.toSafeObject(),
  });
});

// @desc Authenticate user & return token
// @route POST /api/auth/login
// @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated');
  }

  res.json({
    success: true,
    token: generateToken(user),
    user: user.toSafeObject(),
  });
});

// @desc Get current logged-in user
// @route GET /api/auth/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

module.exports = { register, login, getMe };
