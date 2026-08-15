const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_success';

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    console.error('Falling back to unconnected state. API routes that hit the DB will fail until MongoDB is reachable.');
    console.error('Tip: set MONGO_URI in backend/.env to a local mongod or a MongoDB Atlas connection string.');
  }
};

module.exports = connectDB;
