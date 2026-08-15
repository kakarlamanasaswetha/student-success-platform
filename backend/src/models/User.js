const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: { type: String, required: true, minlength: 6, maxlength: 128, select: false },
    role: {
      type: String,
      enum: ['student', 'advisor', 'instructor', 'admin'],
      default: 'student',
    },
    // Student-specific fields (present when role === 'student')
    studentInfo: {
      major: { type: String, default: '' },
      year: {
        type: String,
        enum: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', ''],
        default: '',
      },
      advisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      gpa: { type: Number, default: 0, min: 0, max: 4.0 },
      riskScore: { type: Number, default: 0, min: 0, max: 100 },
      riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
      riskFactors: [{ type: String }],
      lastRiskUpdate: { type: Date, default: null },
    },
    // Instructor/advisor-specific fields
    staffInfo: {
      department: { type: String, default: '' },
      title: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
