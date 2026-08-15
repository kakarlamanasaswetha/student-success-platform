# Manual QA Checklist

A feature/button-level checklist for manually testing the Student Success Platform.
Check items off as you verify them; file a bug with the unchecked item's exact wording
if something doesn't behave as described.

## Setup

1. Backend running (`cd backend && npm run dev`) with MongoDB reachable and seeded (`npm run seed`).
2. Frontend running (`cd frontend && npm run dev`), open http://localhost:5173.
3. Demo accounts (password for all: `password123`):

   | Role | Email |
   |---|---|
   | Advisor | `advisor@demo.edu` |
   | Instructor (CS201, CS310) | `instructor@demo.edu` |
   | Instructor (MATH210) | `instructor2@demo.edu` |
   | Student — at-risk | `student2@demo.edu`, `student5@demo.edu`, `student8@demo.edu` |
   | Student — moderate | `student3@demo.edu`, `student6@demo.edu` |
   | Student — strong | `student1@demo.edu`, `student4@demo.edu`, `student7@demo.edu` |

4. To test **live AI mode** vs **demo/mock mode**, toggle `OPENAI_API_KEY` in `backend/.env`
   and restart the backend; the UI shows a "Live AI" / "Demo mode" badge wherever AI content appears.

---

## Auth (`Login.jsx`, `Register.jsx`)

- [ ] Login: email + password fields validate/submit correctly
- [ ] Login: invalid credentials show the red error banner
- [ ] Login: "Sign in" button disables + shows "Signing in…" while pending
- [ ] Login: redirects to the page you were trying to reach (`state.from`) after success, otherwise to `/`
- [ ] Login: "Register" link navigates to `/register`
- [ ] Login: quick-login buttons (Student at-risk / Advisor / Instructor) correctly autofill email+password without submitting
- [ ] Register: name/email/password/role fields validate (password min length 6)
- [ ] Register: Major + Year fields only appear when role = Student
- [ ] Register: duplicate-email error displays correctly
- [ ] Register: "Create account" button disables + shows "Creating account…" while pending
- [ ] Register: successful registration logs you in and redirects to `/`
- [ ] Register: "Sign in" link navigates to `/login`

## Navbar (`Navbar.jsx`)

- [ ] Nav links differ correctly by role (Student: Dashboard only; Advisor: At-Risk Students + Alerts; Instructor: My Courses + Alerts)
- [ ] Active-link highlighting matches current route
- [ ] User name/role displays correctly in the corner
- [ ] "Log out" button clears session and redirects to `/login`
- [ ] Navbar is hidden when logged out

## Route protection (`ProtectedRoute.jsx`, `App.jsx`)

- [ ] Unauthenticated user hitting any protected route → redirected to `/login`
- [ ] Student trying to hit `/students/:id` or `/alerts` → redirected to `/`
- [ ] Unknown URL → redirected to `/`
- [ ] Session persists across page refresh (token in localStorage)
- [ ] Expired/invalid token → auto-redirect to `/login` on any API call (401 interceptor)

## Student Dashboard (`StudentDashboard.jsx`)

- [ ] Risk badge (level + score) renders correctly
- [ ] Risk gauge doughnut chart renders and matches score/level color (green/amber/red)
- [ ] Risk factors list populates
- [ ] Stat tiles: Courses, Avg grade, Attendance, Completion — values correct
- [ ] Enrolled courses list shows code/title/credits/current grade (or "No grade yet")
- [ ] Grade Trend line chart renders (and empty-state message when no graded work)
- [ ] Attendance Trend bar chart renders, colored by rate thresholds (and empty-state message)
- [ ] AI Recommendations: content + tips render
- [ ] AI Recommendations: "Regenerate" button re-fetches with `refresh=true` and shows "Generating…" while pending
- [ ] AI Recommendations: "Live AI" vs "Demo mode" badge reflects actual OpenAI key presence
- [ ] Chat widget only appears on the student's **own** dashboard, not when an advisor/instructor is viewing it
- [ ] Chat widget: loads prior history on mount, or shows the welcome message if none
- [ ] Chat widget: typing + "Send" (and disabled state while sending / on empty input)
- [ ] Chat widget: user + assistant bubbles render correctly, auto-scrolls to bottom
- [ ] Chat widget: "Thinking…" indicator shows while awaiting reply
- [ ] Chat widget: mode badge updates after first reply
- [ ] Chat widget: network failure shows the fallback error message instead of crashing

## Advisor Dashboard (`AdvisorDashboard.jsx`)

- [ ] Summary cards (Total/High/Medium/Low) match table contents
- [ ] Filter buttons (All/High/Medium/Low) correctly filter the table
- [ ] Search input + "Search" button filters by name/email
- [ ] Table columns (name, email, major/year, GPA, risk badge) render correctly
- [ ] "View profile →" link navigates to `/students/:id`
- [ ] Empty state shows when filter/search yields no results

## Instructor Dashboard (`InstructorDashboard.jsx`)

- [ ] Course selector buttons list all courses the instructor teaches
- [ ] Selecting a course loads that course's roster
- [ ] Roster table (grade, completion %, attendance %, risk badge) renders correctly per student
- [ ] "View profile →" link navigates to `/students/:id`
- [ ] Empty state when instructor has zero assigned courses

## Student Profile / advisor view (`StudentProfile.jsx`)

- [ ] "← Back to student list" link works
- [ ] "Recalculate risk & alerts" button triggers recompute and refreshes the embedded dashboard (loading state while pending)
- [ ] Embedded dashboard section shows same data as `StudentDashboard` but **without** the chat widget
- [ ] AI Performance Summary loads and displays, with correct Live AI/Demo mode badge
- [ ] Advisor Notes: textarea + category select + "Add note" button (disabled on empty/while saving)
- [ ] New note appears at top of list immediately after adding
- [ ] Notes list shows category badge, timestamp, note text, author name
- [ ] Empty state when no notes exist yet

## Alerts (`Alerts.jsx`)

- [ ] Status tabs (Open/Acknowledged/Resolved) switch the list correctly
- [ ] Alert card: student name link → `/students/:id`
- [ ] Severity badge, message, and reasons list render correctly
- [ ] "Acknowledge" button — only visible on Open tab, disables while pending, moves alert out of Open list after action
- [ ] "Resolve" button — visible on Open + Acknowledged, hidden on Resolved, moves alert to Resolved after action
- [ ] Empty state per tab ("No open/acknowledged/resolved alerts")

## Cross-cutting / backend-driven behavior

- [ ] Role-based API authorization (student can't hit advisor/instructor-only endpoints and vice versa — check for 403s)
- [ ] Risk scoring correctness across the 3 seeded profiles (strong/moderate/at-risk students)
- [ ] Alert auto-creation when risk crosses medium/high threshold; no duplicate alerts on repeated recalculation
- [ ] Mock AI fallback triggers correctly when `OPENAI_API_KEY` is unset (all three AI features: recommendations, summary, chat)
- [ ] Responsive layout on mobile widths (nav collapses, tables scroll, charts resize)
- [ ] Chart.js charts re-render correctly on data refresh (no duplicate/ghost canvases)
