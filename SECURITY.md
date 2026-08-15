# Security Audit

Audit date: 2026-08-09. Scope: full application (backend REST API, frontend, dependencies).
Findings are listed most-severe first, each with what was found, what was fixed, and how it
was verified. Re-run the verification steps after any change to auth, data-access, or input
handling code.

## Critical

### 1. JWT secret was the literal placeholder value

`backend/.env` had `JWT_SECRET=replace_this_with_a_long_random_secret` — copied verbatim from
`.env.example` during initial setup and never rotated. Anyone who saw the public template
could forge valid JWTs for any user, choosing arbitrary user IDs/roles, without ever
authenticating.

**Fix:** generated a 384-bit random secret via `crypto.randomBytes(48)`, replaced it in
`backend/.env`. This invalidates all previously-issued tokens (expected — everyone needs to
log in again).

**Takeaway for future deployments:** never `cp .env.example .env` and run with it as-is for
anything beyond a throwaway local smoke test — generate real secrets first.

### 2. Broken access control — instructors could view any student university-wide

`courseController.getRoster` correctly scoped instructors to courses they teach, but:

- `GET/POST /api/students/:id/*` (dashboard, grades, attendance, AI risk summary,
  recalculate-risk)
- `GET/POST /api/advisor/students/:id/*` (AI performance summary, confidential advisor
  notes — including wellness/financial/behavioral categories)
- `GET /api/advisor/students` (bulk roster)

had no equivalent check. Any instructor account could pull up any student in the university,
including students never enrolled in one of their courses, and read/write confidential
advisor case notes about them. Verified by calling these endpoints as an instructor against a
student outside their courses and confirming full data access.

**Fix:** added `backend/src/middleware/studentAccess.js`
(`restrictInstructorToOwnStudents`), applied to every per-student route. It checks the
requesting instructor actually teaches a course the target student is enrolled in;
`listStudents` filters the same way for the `instructor` role. Advisors/admins keep
unrestricted access by design (shared advising caseload).

**Verified:**
- Instructor with no relationship to a student → `403 Access denied`.
- Instructor viewing their own student → `200` with correct data.
- Instructor calling the bulk list → correctly scoped from 8 students down to 3.
- Advisor calling the bulk list → still sees the full 8-student caseload (unaffected).

## High

### 3. NoSQL operator injection

Query-string bracket notation (e.g. `?search[$ne]=x`, `?status[$gt]=`) is parsed by Express's
default query parser into nested objects, letting a client turn a string filter into a Mongo
operator object and change query semantics on any endpoint that dropped `req.query`/
`req.body` straight into a filter (advisor search, alert status filter, and others).

**Fix:** added `express-mongo-sanitize` globally in `app.js`, stripping `$`/`.`-prefixed keys
from `req.body`/`req.params`/`req.query` before any route runs.

**Verified:** `GET /api/advisor/students?search[$ne]=x` — the sanitizer neuters the `$ne` key,
the resulting non-string value is caught by an explicit type check, returns a clean `400`
instead of altering the query.

### 4. ReDoS / regex injection in advisor student search

The `search` query param was spliced directly into a MongoDB `$regex` unescaped, letting a
client submit a catastrophic-backtracking pattern (e.g. `(a+)+$`) or broaden matches via
regex metacharacters.

**Fix:** added `backend/src/utils/escapeRegex.js`, applied to the search term (also capped at
100 characters) in `advisorController.listStudents`.

**Verified:** a crafted backtracking pattern is now matched as literal text (0 results, no
hang) instead of being compiled as a regex.

### 5. No brute-force protection on login/registration

The only rate limiting was a blanket 500 requests/15 min across the entire API — far too
permissive to meaningfully slow down credential stuffing or password guessing against
`/api/auth/login`.

**Fix:** added a dedicated 20 requests/15 min limiter (`authLimiter` in `app.js`) on
`/api/auth/login` and `/api/auth/register`.

**Verified:** requests 1–20 return normal `401`s for bad credentials; request 21+ returns
`429 Too many attempts`.

### 6. JWT verification didn't pin the algorithm

`jwt.verify(token, secret)` was called without an explicit `algorithms` allow-list — a known
hardening gap that leaves room for algorithm-confusion/downgrade attacks depending on library
configuration.

**Fix:** explicit `{ algorithms: ['HS256'] }` added to both `jwt.sign` (`generateToken.js`)
and `jwt.verify` (`middleware/auth.js`).

### 7. Error handler leaked internal implementation details and used wrong status codes

A malformed ID in a URL (e.g. `GET /api/students/not-an-id/dashboard`) threw a raw Mongoose
`CastError` straight to the generic error handler: status `500` (should be `400` — it's a
client input error), with a `message` field exposing the Mongoose model name and field path
regardless of environment, plus a full stack trace with absolute server file paths in
non-production mode. Same class of leak applied to `ValidationError` and duplicate-key
errors.

**Fix:** `middleware/errorHandler.js` now maps `CastError` → `400` with a generic message,
`ValidationError` → `400` with just the field-level messages, MongoDB duplicate-key
(`code 11000`) → `409`. The `stack` field remains dev-only as before.

**Verified:** before → `500` + full internal stack + Mongoose message; after → `400` +
`"Invalid ID format"`.

## Medium

### 8. Vulnerable dependency: `react-router-dom`

Was on `^6.26.2`, within a range (6.0.0–7.17.0) vulnerable to an open-redirect
(`GHSA-wrjc-x8rr-h8h6`) and an SSR-hydration constructor-injection issue
(`GHSA-337j-9hxr-rhxg`). Practical exploitability in this app is low — it's a client-only SPA
with no user-controlled `Link`/`navigate` targets and no SSR — but the dependency itself was
flagged by `npm audit`.

**Fix:** bumped to `^7.18.2` (patched).

**Verified:** clean `npm install`, `npm run build` succeeds, dev server boots, and a full
login flow through the Vite proxy still works.

### 9. No security headers

No CSP, `X-Frame-Options`, `X-Content-Type-Options`, or HSTS on any response.

**Fix:** added `helmet()` as the first middleware in `app.js` (safe defaults — this is a pure
JSON API with no HTML views or inline scripts to accommodate).

**Verified:** `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`,
`X-Frame-Options` all present on responses.

### 10. Unbounded free-text fields

`AdvisorNote.note` and `ChatMessage.content` had no length cap beyond the global 1MB JSON
body limit — a storage-abuse vector via repeated large payloads. The chat endpoint also had
no length check *before* forwarding the message to OpenAI in live mode, wasting an API call
on oversized input before the DB-level cap would ever reject it.

**Fix:** added `maxlength` to `AdvisorNote.note` (5000), `ChatMessage.content` (4000),
`User.name` (200), `User.email` (254), `User.password` (128); added an explicit 4000-char
check in `aiController.sendChatMessage` before any AI call.

**Verified:** a 5000-character chat message is now rejected with `400` immediately, before
reaching the AI service.

### 11. Login/register relied on incidental type coercion for input safety

`email.toLowerCase()` would throw on a non-string (e.g. object-shaped) input, which
incidentally — not deliberately — blocked one class of injection attempt. Not a real
vulnerability once `express-mongo-sanitize` is in place, but relying on an accidental crash
instead of explicit validation is fragile.

**Fix:** explicit `typeof` checks on `name`/`email`/`password` in both `register` and
`login`, on top of the sanitizer middleware (defense-in-depth, not redundant — catches cases
sanitize doesn't, like a plain non-string scalar).

## Low — documented, not code-changed

- **`esbuild`/Vite dev-server CORS vulnerability** (moderate, `GHSA-67mh-4wv8-2f99`) — only
  exposes the local `npm run dev` server to malicious websites visited in the same browser
  session; does not affect production builds. Fixing requires a Vite major-version jump
  (5→8). Left as an accepted risk rather than risking build-tooling breakage without a full
  retest; revisit if this app is ever deployed with `vite dev` exposed beyond localhost.
- **Registration reveals whether an email is already registered** (`409` vs. a generic
  message) — a minor user-enumeration surface. Common, generally accepted tradeoff for
  registration UX; not fixed.
- **JWT tokens are long-lived (7 days) with no revocation/refresh mechanism** — inherent to
  stateless JWT without a server-side token store. Worth a refresh-token design before any
  production deployment handling real student data.
- **No TLS/HTTPS enforcement in application code** — this is a reverse-proxy/hosting-layer
  concern, not something to bake into Express; ensure whatever terminates TLS in production
  is configured correctly.
- **Minor LLM prompt-injection surface** in the chatbot — user messages feed directly into
  the OpenAI prompt. Doesn't grant access to other users' data or elevate privileges (the
  context object is always the requesting user's own data), so this is an output-quality/tone
  risk rather than a security-boundary breach.

## Verification method

All fixes were verified against the running app via a curl-based regression pass covering:
auth (login/register/rate-limit), student dashboard load, chatbot (mock mode), advisor
search, malformed-ID handling, NoSQL/regex injection attempts, and instructor
cross-course access attempts (both denied and allowed cases). `node --check` passes on every
backend file; `npm run build` passes on the frontend.
