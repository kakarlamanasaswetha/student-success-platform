#!/bin/bash
# Seeds demo data into the local MongoDB after the app has started. Only in
# .platform/hooks/ (real app deploys), deliberately NOT duplicated into
# .platform/confighooks/ — a config-only update (e.g. changing an env var)
# shouldn't wipe and reset the database back to demo data every time.
# Non-fatal: seeding is a nice-to-have, not worth failing the deploy over.
set -u

echo "==> Seeding demo data"
cd /var/app/current/backend
node src/seed/seed.js || echo "==> Seed script failed (non-fatal, app already started)"
