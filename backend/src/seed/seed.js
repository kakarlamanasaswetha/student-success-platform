/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const AttendanceRecord = require('../models/AttendanceRecord');
const AdvisorNote = require('../models/AdvisorNote');
const Alert = require('../models/Alert');
const Recommendation = require('../models/Recommendation');
const ChatMessage = require('../models/ChatMessage');

const { evaluateAndAlert } = require('../services/alertService');

const TERM = 'Fall 2026';

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const clearCollections = async () => {
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Enrollment.deleteMany({}),
    Assignment.deleteMany({}),
    Submission.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    AdvisorNote.deleteMany({}),
    Alert.deleteMany({}),
    Recommendation.deleteMany({}),
    ChatMessage.deleteMany({}),
  ]);
};

/** Generates attendance for a student in a course over `weeks` weeks, 2x/week, given an absence rate. */
const seedAttendance = async (studentId, courseId, weeks, absenceRate) => {
  const docs = [];
  for (let w = weeks; w >= 1; w -= 1) {
    for (const dayOffset of [0, 3]) {
      const date = daysAgo(w * 7 - dayOffset);
      const roll = Math.random();
      let status = 'present';
      if (roll < absenceRate) status = 'absent';
      else if (roll < absenceRate + 0.05) status = 'excused';
      docs.push({ student: studentId, course: courseId, date, status });
    }
  }
  await AttendanceRecord.insertMany(docs);
};

/** Creates assignments for a course (if not already created) and per-student submissions. */
const seedAssignmentsAndSubmissions = async (course, students, profileFn) => {
  const assignmentDefs = [
    { title: 'Homework 1', type: 'homework', dueDate: daysAgo(35), maxScore: 100, weight: 1 },
    { title: 'Quiz 1', type: 'quiz', dueDate: daysAgo(30), maxScore: 50, weight: 1 },
    { title: 'Homework 2', type: 'homework', dueDate: daysAgo(24), maxScore: 100, weight: 1 },
    { title: 'Midterm Exam', type: 'exam', dueDate: daysAgo(18), maxScore: 100, weight: 2 },
    { title: 'Homework 3', type: 'homework', dueDate: daysAgo(12), maxScore: 100, weight: 1 },
    { title: 'Quiz 2', type: 'quiz', dueDate: daysAgo(7), maxScore: 50, weight: 1 },
    { title: 'Project Milestone', type: 'project', dueDate: daysAgo(2), maxScore: 100, weight: 1.5 },
    { title: 'Homework 4', type: 'homework', dueDate: daysFromNow(5), maxScore: 100, weight: 1 },
    { title: 'Final Project', type: 'project', dueDate: daysFromNow(21), maxScore: 100, weight: 2 },
  ];

  const assignments = await Assignment.insertMany(
    assignmentDefs.map((a) => ({ ...a, course: course._id }))
  );

  for (const student of students) {
    const profile = profileFn(student);
    let totalScore = 0;
    let totalWeight = 0;

    for (const assignment of assignments) {
      const isFuture = new Date(assignment.dueDate) > new Date();
      let status = 'submitted';
      let score = null;
      let submittedAt = null;

      if (isFuture) {
        status = 'missing'; // not yet due, treated as not-yet-submitted (excluded from completion calc via future check downstream is skipped for simplicity)
      } else {
        const roll = Math.random();
        if (roll < profile.missRate) {
          status = 'missing';
        } else if (roll < profile.missRate + profile.lateRate) {
          status = 'late';
          score = Math.max(0, Math.round(profile.baseScore(assignment) + (Math.random() * 10 - 8)));
          submittedAt = assignment.dueDate;
        } else {
          status = 'submitted';
          score = Math.max(0, Math.min(assignment.maxScore, Math.round(profile.baseScore(assignment) + (Math.random() * 10 - 5))));
          submittedAt = assignment.dueDate;
        }
      }

      if (score !== null) {
        totalScore += (score / assignment.maxScore) * 100 * assignment.weight;
        totalWeight += assignment.weight;
      }

      await Submission.create({
        assignment: assignment._id,
        student: student._id,
        course: course._id,
        status,
        score,
        submittedAt,
      });
    }

    const currentGrade = totalWeight ? Math.round(totalScore / totalWeight) : null;
    await Enrollment.findOneAndUpdate(
      { student: student._id, course: course._id },
      { currentGrade, letterGrade: letterFromPercent(currentGrade) },
      { upsert: true }
    );

    await seedAttendance(student._id, course._id, 6, profile.absenceRate);
  }
};

const letterFromPercent = (pct) => {
  if (pct === null || pct === undefined) return '';
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 60) return 'D';
  return 'F';
};

const run = async () => {
  await connectDB();
  console.log('Clearing existing collections...');
  await clearCollections();

  console.log('Creating users...');

  const advisor = await User.create({
    name: 'Dr. Maria Chen',
    email: 'advisor@demo.edu',
    password: 'password123',
    role: 'advisor',
    staffInfo: { department: 'Academic Advising', title: 'Senior Academic Advisor' },
  });

  const instructorCS = await User.create({
    name: 'Prof. James Whitfield',
    email: 'instructor@demo.edu',
    password: 'password123',
    role: 'instructor',
    staffInfo: { department: 'Computer Science', title: 'Associate Professor' },
  });

  const instructorMath = await User.create({
    name: 'Prof. Elena Ruiz',
    email: 'instructor2@demo.edu',
    password: 'password123',
    role: 'instructor',
    staffInfo: { department: 'Mathematics', title: 'Assistant Professor' },
  });

  const studentDefs = [
    { name: 'Aisha Patel', email: 'student1@demo.edu', major: 'Computer Science', year: 'Sophomore', profile: 'strong' },
    { name: 'Marcus Johnson', email: 'student2@demo.edu', major: 'Computer Science', year: 'Junior', profile: 'atrisk' },
    { name: 'Sofia Nguyen', email: 'student3@demo.edu', major: 'Mathematics', year: 'Freshman', profile: 'moderate' },
    { name: 'Liam O’Brien', email: 'student4@demo.edu', major: 'Computer Science', year: 'Senior', profile: 'strong' },
    { name: 'Zara Ahmed', email: 'student5@demo.edu', major: 'Mathematics', year: 'Sophomore', profile: 'atrisk' },
    { name: 'Diego Ramirez', email: 'student6@demo.edu', major: 'Computer Science', year: 'Junior', profile: 'moderate' },
    { name: 'Grace Kim', email: 'student7@demo.edu', major: 'Data Science', year: 'Freshman', profile: 'strong' },
    { name: 'Tyler Brooks', email: 'student8@demo.edu', major: 'Computer Science', year: 'Sophomore', profile: 'atrisk' },
  ];

  const students = [];
  for (const def of studentDefs) {
    const student = await User.create({
      name: def.name,
      email: def.email,
      password: 'password123',
      role: 'student',
      studentInfo: {
        major: def.major,
        year: def.year,
        advisor: advisor._id,
      },
    });
    students.push({ user: student, profile: def.profile });
  }

  console.log('Creating courses...');

  const courses = await Course.insertMany([
    { code: 'CS201', title: 'Data Structures & Algorithms', description: 'Core CS data structures, algorithm design, and complexity analysis.', credits: 4, term: TERM, instructor: instructorCS._id },
    { code: 'CS310', title: 'Database Systems', description: 'Relational and NoSQL database design, SQL, and transactions.', credits: 3, term: TERM, instructor: instructorCS._id },
    { code: 'MATH210', title: 'Linear Algebra', description: 'Vector spaces, matrices, eigenvalues, and applications.', credits: 3, term: TERM, instructor: instructorMath._id },
  ]);

  // Enroll students: CS majors -> CS201 + CS310, Math majors -> MATH210 + CS201, Data Science -> all three
  const courseAssignment = {
    'Computer Science': [courses[0], courses[1]],
    Mathematics: [courses[2], courses[0]],
    'Data Science': [courses[0], courses[1], courses[2]],
  };

  console.log('Creating enrollments, assignments, submissions, and attendance (this can take a bit)...');

  const profileConfig = {
    strong: { missRate: 0.02, lateRate: 0.05, absenceRate: 0.03, baseScore: (a) => a.maxScore * 0.92 },
    moderate: { missRate: 0.08, lateRate: 0.15, absenceRate: 0.12, baseScore: (a) => a.maxScore * 0.78 },
    atrisk: { missRate: 0.28, lateRate: 0.22, absenceRate: 0.32, baseScore: (a) => a.maxScore * 0.6 },
  };

  const enrollmentsByCourse = new Map();
  for (const { user, profile } of students) {
    const targetCourses = courseAssignment[user.studentInfo.major] || [courses[0]];
    for (const course of targetCourses) {
      await Enrollment.create({ student: user._id, course: course._id, currentGrade: null });
      if (!enrollmentsByCourse.has(String(course._id))) enrollmentsByCourse.set(String(course._id), []);
      enrollmentsByCourse.get(String(course._id)).push({ student: user, profile });
    }
  }

  for (const course of courses) {
    const roster = enrollmentsByCourse.get(String(course._id)) || [];
    await seedAssignmentsAndSubmissions(
      course,
      roster.map((r) => r.student),
      (student) => {
        const entry = roster.find((r) => String(r.student._id) === String(student._id));
        return profileConfig[entry.profile];
      }
    );
  }

  console.log('Computing risk scores and generating alerts...');
  for (const { user } of students) {
    await evaluateAndAlert(user._id);
  }

  console.log('Adding sample advisor notes...');
  const atRiskStudent = students.find((s) => s.profile === 'atrisk').user;
  await AdvisorNote.create({
    student: atRiskStudent._id,
    author: advisor._id,
    note: 'Met with student to discuss recent missed assignments. They mentioned a demanding part-time work schedule. Recommended time-management workshop and reduced course load next term.',
    category: 'academic',
  });
  await AdvisorNote.create({
    student: atRiskStudent._id,
    author: advisor._id,
    note: 'Follow-up: student attended the time-management workshop. Will check in again in 2 weeks to review attendance trend.',
    category: 'general',
  });

  console.log('\nSeed complete!\n');
  console.log('Demo accounts (all passwords: password123):');
  console.log(`  Advisor:    ${advisor.email}`);
  console.log(`  Instructor: ${instructorCS.email}  (teaches CS201, CS310)`);
  console.log(`  Instructor: ${instructorMath.email}  (teaches MATH210)`);
  studentDefs.forEach((s) => console.log(`  Student:    ${s.email}  (${s.profile})`));

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
