#!/usr/bin/env bash
# Your deploy command from now on. Run ON THE BOX.
set -euo pipefail
cd /home/ec2-user/app
git pull --ff-only
cd MTShowcaseWebsite/server
npm ci
npm run build
sudo systemctl restart ellie-api
sleep 2
curl -s localhost:3000/health && echo " <- API healthy"
