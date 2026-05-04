#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-shot bootstrap for a fresh Ubuntu 24.04 VPS.
#
#   curl -fsSL https://raw.githubusercontent.com/<you>/<repo>/main/scraper/bootstrap.sh | sudo bash
#   # …or scp this file up and run:  sudo bash bootstrap.sh
#
# After this finishes:
#   1. cd /opt/slot-scraper && sudo -u scraper nano .env   (paste real values)
#   2. sudo -u scraper node scrape-vfs.mjs --once          (smoke test)
#   3. sudo systemctl enable --now slot-scraper-vfs        (run forever)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_URL="${REPO_URL:-}"      # optional: if set, git-clones instead of expecting scp
APP_DIR=/opt/slot-scraper
SVC_USER=scraper

echo "▶ Updating apt + installing Node 20"
apt-get update -y
apt-get install -y curl git ca-certificates
if ! command -v node >/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "▶ Creating service user"
id -u $SVC_USER &>/dev/null || useradd -r -m -d /home/$SVC_USER -s /bin/bash $SVC_USER

echo "▶ Preparing $APP_DIR"
mkdir -p $APP_DIR
chown -R $SVC_USER:$SVC_USER $APP_DIR

if [[ -n "$REPO_URL" ]]; then
  echo "▶ Cloning $REPO_URL"
  sudo -u $SVC_USER git clone --depth 1 "$REPO_URL" /tmp/repo
  cp -r /tmp/repo/scraper/* $APP_DIR/
  rm -rf /tmp/repo
  chown -R $SVC_USER:$SVC_USER $APP_DIR
else
  echo "ℹ Expecting scraper files already present in $APP_DIR (scp them now if not)."
  ls -la $APP_DIR || true
fi

echo "▶ Installing npm deps"
cd $APP_DIR
sudo -u $SVC_USER npm install --no-audit --no-fund

echo "▶ Installing Playwright + Chromium with system deps"
sudo -u $SVC_USER npx playwright install --with-deps chromium

echo "▶ Seeding .env (edit before starting!)"
if [[ ! -f $APP_DIR/.env ]]; then
  cp $APP_DIR/.env.example $APP_DIR/.env
  chown $SVC_USER:$SVC_USER $APP_DIR/.env
  chmod 600 $APP_DIR/.env
fi

echo "▶ Installing systemd unit"
cp $APP_DIR/systemd/slot-scraper-vfs.service /etc/systemd/system/
systemctl daemon-reload

cat <<EOF

✅ Bootstrap complete.

Next steps:
  1. sudo -u $SVC_USER nano $APP_DIR/.env
        ➜ paste WEBHOOK_URL, SCRAPER_KEY, SUPABASE_URL, SUPABASE_ANON_KEY,
          IMAP_USER, IMAP_PASS
  2. cd $APP_DIR && sudo -u $SVC_USER node scrape-vfs.mjs --once
        ➜ verify slots get POSTed and a heartbeat lands in the dashboard
  3. sudo systemctl enable --now slot-scraper-vfs
        ➜ run forever
  4. sudo journalctl -u slot-scraper-vfs -f
        ➜ live logs

EOF