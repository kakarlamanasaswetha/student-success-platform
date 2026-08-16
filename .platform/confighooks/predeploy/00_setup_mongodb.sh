#!/bin/bash
# Self-hosted MongoDB on the same EC2 instance, bound to localhost only.
#
# We tried MongoDB Atlas first, but hit a persistent, unexplained SCRAM auth
# rejection from Atlas's cluster (ruled out: network access list, connection
# string format, DNS/SRV/TXT resolution, direct TCP to all three replica
# nodes, TLS, and six different username/password combinations — all failed
# identically). Rather than stay blocked on that, this runs MongoDB locally
# on the single instance we already have. It's not exposed externally (only
# 127.0.0.1), and backend/src/config/db.js already defaults MONGO_URI to
# exactly this address, so no env var needs to be set for the app to find it.
#
# IMPORTANT: also present at .platform/confighooks/predeploy/ — see the note
# in that copy (and in the main app-build hook) about why config-only EB
# updates need their own copy of platform hooks. Keep both identical.
set -eu

if systemctl is-active --quiet mongod 2>/dev/null; then
  echo "==> MongoDB already installed and running, skipping setup"
  exit 0
fi

echo "==> Installing MongoDB Community Server"
cat > /etc/yum.repos.d/mongodb-org-7.0.repo <<'REPO'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc
REPO

dnf install -y mongodb-org

# t3.micro only has 1GB RAM shared with the Node app — cap WiredTiger's
# cache well below its default (50% of RAM-1GB) so it doesn't starve the app.
sed -i '/^storage:/a\  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 0.25' /etc/mongod.conf

echo "==> Starting MongoDB"
systemctl enable mongod
systemctl restart mongod

echo "==> Waiting for MongoDB to accept connections"
for i in $(seq 1 30); do
  if timeout 1 bash -c 'cat < /dev/null > /dev/tcp/127.0.0.1/27017' 2>/dev/null; then
    echo "==> MongoDB is accepting connections"
    exit 0
  fi
  sleep 1
done
echo "==> WARNING: MongoDB did not become ready within 30s (continuing anyway)"
