#!/usr/bin/env bash
# Run ON THE BOX after the deploy key is registered on GitHub.
set -euo pipefail

REPO="git@github.com:ethan-godsey/MTShowcaseWebsite.git"
APP_DIR="/home/ec2-user/app"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> Cloning"
  ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null
  git clone "$REPO" "$APP_DIR"
fi

cd "$APP_DIR/server"
npm ci
npm run build

if [ ! -f /etc/ellie-api.env ]; then
  echo
  echo "!! Build succeeded. One thing left before the service can start."
  echo "   Create /etc/ellie-api.env, then re-run this script:"
  echo "     sudo nano /etc/ellie-api.env"
  echo "   Contents (no quotes, no 'export'):"
  echo "     DATABASE_URL=<your Neon POOLED connection string>"
  echo "     PORT=3000"
  echo "     NODE_ENV=production"
  echo "     TRUST_PROXY_HOPS=2"
  echo "   Then: sudo chmod 600 /etc/ellie-api.env"
  echo
  echo "   NOTE: do NOT set AUTH_DEV_BYPASS. Leaving it unset keeps the write"
  echo "         routes fail-closed (401) until real Cognito auth ships."
  exit 1
fi

sudo cp deploy/ellie-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ellie-api
sleep 2
sudo systemctl --no-pager status ellie-api | head -12
echo
echo "==> Local health check (the SG blocks port 3000 from anywhere but CloudFront):"
curl -s localhost:3000/health && echo
