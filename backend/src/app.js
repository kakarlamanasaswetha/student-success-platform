const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

require('./models'); // registers every Mongoose model before any route/populate call runs

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const advisorRoutes = require('./routes/advisorRoutes');
const courseRoutes = require('./routes/courseRoutes');
const alertRoutes = require('./routes/alertRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Serves the built frontend too (see the static-serving block below), so helmet's
// defaults are appropriate here — except upgradeInsecureRequests, which tells the
// browser to force every subresource (JS/CSS) request to HTTPS even on a plain-HTTP
// page. This deployment has no TLS anywhere (single EC2 instance, no load balancer/
// cert), so that directive silently breaks the app: the page itself loads, but every
// asset request gets refused and React never mounts. Only bites on a real hostname —
// browsers exempt `localhost` from this behavior, which is why it never showed up
// in local testing.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        upgradeInsecureRequests: null,
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Strips any `$`-or-`.`-prefixed keys from req.body/params/query so a client can't
// inject Mongo operators (e.g. ?search[$ne]=... or a JSON body field shaped like
// {"$gt": ""}) into a query built from user input.
app.use(
  mongoSanitize({
    replaceWith: '_',
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Login/register are brute-force/credential-stuffing targets — the blanket 500
// req/15min API limiter above is far too permissive to slow that down on its own.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Student Success Platform API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);

// Single-instance deployment (e.g. AWS Elastic Beanstalk): this same Node process
// also serves the built React app, so frontend + backend are one deployable unit
// on one origin. Guarded by existsSync so plain `node src/server.js` in local dev
// (no frontend build present) is unaffected and still runs as an API-only server.
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
