require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Student Success Platform API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    console.log(
      process.env.OPENAI_API_KEY
        ? 'OpenAI: LIVE mode (API key detected)'
        : 'OpenAI: DEMO mode (no API key set — using mock AI responses)'
    );
  });
};

start();
