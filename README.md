# Student Success Platform

An AI-powered early-warning system for higher education. It analyzes grades, assignment
completion, and attendance to flag at-risk students *before* midterms, gives students
personalized AI study recommendations, and gives advisors/instructors a dashboard of
who needs outreach — plus an academic-assistant chatbot for students.

Full-stack MVP: **React + Tailwind + Chart.js** frontend, **Node/Express** REST API,
**MongoDB (Atlas-ready)** via Mongoose, **JWT auth**, and an **OpenAI integration that
runs in a free demo/mock mode** when no API key is configured — so the whole app is
demoable with zero API cost.

## Why this exists

Universities typically rely on faculty observations and midterm grades to catch struggling
students — by then, it's often too late to help. This platform continuously computes a
weighted risk score from attendance, assignment completion, grades, and grade trend, and
automatically raises alerts for advisors when a student crosses into medium/high risk.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 (Vite), React Router, Tailwind CSS, Chart.js / react-chartjs-2, Axios |
| Backend | Node.js, Express 4, JWT auth (jsonwebtoken + bcryptjs), Mongoose 8 |
| Database | MongoDB / MongoDB Atlas |
| AI | OpenAI API (chat completions) with a built-in mock mode |

## Project structure

```
student-success-platform/
├── backend/
│   ├── src/
│   │   ├── config/db.js            # MongoDB connection
│   │   ├── models/                 # Mongoose schemas
│   │   ├── controllers/            # Route handlers
│   │   ├── routes/                 # Express routers
│   │   ├── middleware/             # JWT auth, role guard, error handler
│   │   ├── services/                # risk scoring, alerts, OpenAI wrapper
│   │   ├── utils/                   # JWT signing, mock AI canned responses
│   │   └── seed/seed.js             # demo data generator
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                     # axios client + endpoint functions
│   │   ├── context/AuthContext.jsx  # JWT session state
│   │   ├── components/              # charts, chat widget, layout, shared UI
│   │   └── pages/                   # Login, Register, dashboards, Alerts
│   ├── .env.example
│   └── package.json
└── README.md
```

## Data model (MongoDB)

- **User** — students, advisors, instructors, admins in one collection (`role` field).
  Students carry a `studentInfo` sub-document (major, year, GPA, risk score/level/factors).
- **Course**, **Enrollment** — course catalog and per-student current grade.
- **Assignment**, **Submission** — assignment definitions and per-student completion/score.
- **AttendanceRecord** — per-class-session attendance status.
- **AdvisorNote** — advisor case notes on a student.
- **Alert** — auto-generated at-risk notifications (open/acknowledged/resolved).
- **Recommendation** — stored AI-generated study recommendations (audit trail).
- **ChatMessage** — chat history for the academic-assistant chatbot.

## Risk scoring

`backend/src/services/riskScoreService.js` computes a 0–100 risk score per student:

- 35% grade performance (average current grade across active courses)
- 30% assignment completion rate (missing/late vs. submitted, only for work already due)
- 25% attendance rate
- 10% recent grade trend (declining vs. improving)

Crossing the medium threshold (default 40) or high threshold (default 70, both configurable
via `.env`) triggers `alertService.js` to open (or refresh) an **Alert** document — this is
the "automated alerts for at-risk students" feature. Risk is recalculated on-demand from the
student/advisor dashboards, or via `POST /api/students/:id/recalculate-risk`.

## OpenAI integration + demo mode

`backend/src/services/openaiService.js` wraps three AI features:

1. **Personalized study recommendations** (`generateStudyRecommendation`)
2. **Plain-language performance summaries for advisors** (`summarizePerformance`)
3. **Conversational academic assistant chatbot** (`chatReply`)

If `OPENAI_API_KEY` is set in `backend/.env`, requests go to the real OpenAI Chat Completions
API (model configurable via `OPENAI_MODEL`, default `gpt-4o-mini`). **If no key is set (or a
live call fails), it automatically falls back to realistic canned responses** from
`backend/src/utils/mockAI.js` — tailored to the student's actual risk factors, so the demo
still feels personalized. The UI shows a "Live AI" vs. "Demo mode" badge wherever AI content
appears, and `GET /api/ai/status` reports the current mode.

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB instance — either local (`mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- (Optional) An OpenAI API key for live AI responses — the app works fully without one

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI (local or Atlas), JWT_SECRET, and optionally OPENAI_API_KEY
npm install
npm run seed     # populates demo users, courses, grades, attendance, alerts
npm run dev       # starts the API on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # defaults are fine for local dev (Vite proxies /api to :5000)
npm install
npm run dev             # starts the app on http://localhost:5173
```

### 3. Log in

After seeding, use any of these (password for all: `password123`):

| Role | Email |
|---|---|
| Advisor | `advisor@demo.edu` |
| Instructor (CS201, CS310) | `instructor@demo.edu` |
| Instructor (MATH210) | `instructor2@demo.edu` |
| Student (at-risk) | `student2@demo.edu` |
| Student (moderate risk) | `student3@demo.edu` |
| Student (strong standing) | `student1@demo.edu` |

The login screen also has one-click buttons to autofill the advisor/instructor/at-risk-student
demo accounts.

## Key API endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` / `/api/auth/login` | JWT auth |
| GET | `/api/students/me/dashboard` | Student's own dashboard (or `/api/students/:id/dashboard` for staff) |
| GET | `/api/students/me/progress` | Chart data: grade trend, attendance trend, per-course completion |
| GET | `/api/students/me/recommendations?refresh=true` | AI study recommendations |
| GET | `/api/advisor/students?risk=high&search=` | At-risk student list with filters |
| GET/POST | `/api/advisor/students/:id/notes` | Advisor case notes |
| GET | `/api/advisor/students/:id/summary` | AI performance summary |
| GET | `/api/courses` / `/api/courses/:id/roster` | Instructor course rosters |
| GET | `/api/alerts?status=open` | Automated at-risk alerts |
| PATCH | `/api/alerts/:id/acknowledge` / `/resolve` | Alert lifecycle |
| POST | `/api/ai/chat` | Academic assistant chatbot |

All routes except `/auth/register` and `/auth/login` require `Authorization: Bearer <token>`.

## Deploying with MongoDB Atlas

1. Create a free cluster at MongoDB Atlas, add a database user, and allow your IP (or `0.0.0.0/0` for demos).
2. Copy the connection string into `backend/.env` as `MONGO_URI`, e.g.
   `mongodb+srv://<user>:<password>@cluster0.mongodb.net/student_success?retryWrites=true&w=majority`.
3. Run `npm run seed` once against that URI to populate demo data, then `npm start`.

## Deploying the frontend to AWS App Runner

The frontend (`npm run build` + `npm start`) is ready to deploy as its own App Runner service,
separate from the backend. App Runner's Node.js runtime needs:

- **Build command:** `npm run build`
- **Start command:** `npm start` (runs `vite preview`, which `vite.config.js` configures to bind
  `0.0.0.0` on `process.env.PORT` — falls back to `8080` if App Runner doesn't set `PORT` — and to
  accept any `Host` header, since Vite's preview server otherwise rejects requests for hosts it
  doesn't recognize, which would include App Runner's dynamic `*.awsapprunner.com` domain)
- **Port:** whatever you set `PORT` to in the App Runner service config (defaults to `8080` if left unset)

Two environment variables matter for the frontend and backend to actually talk to each other once
both are deployed as separate services:

1. **`VITE_API_URL`** — set this on the **frontend's** App Runner build environment to the
   backend service's public URL (e.g. `https://xxxx.us-east-1.awsapprunner.com`). Vite inlines
   `VITE_*` variables into the JS bundle at **build time**, not runtime — so this has to be set
   before `npm run build` runs, not just on the running container.
2. **`CLIENT_URL`** — set this on the **backend's** App Runner service to the frontend's public
   URL. The backend's CORS config (`backend/src/app.js`) only allows requests from whatever
   origin `CLIENT_URL` names; without it matching the frontend's real deployed URL, the browser
   will block every API call with a CORS error even though both services are up.

Both were verified locally end-to-end (built with `VITE_API_URL` pointed at a running backend,
served via `npm start`, logged in, and confirmed the dashboard renders with live data) before
these instructions were written.

## Notes on scope

This is an MVP: risk scoring is a transparent weighted-average model (not a trained ML model),
which keeps it explainable to advisors and doesn't require training data. It's the seam where
a real ML risk model could later be swapped in without touching the API surface.
