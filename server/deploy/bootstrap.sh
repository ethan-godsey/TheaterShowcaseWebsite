#!/usr/bin/env bash
# One-time EC2 setup. Run ON THE BOX as ec2-user, after SSHing in.
set -euo pipefail

echo "==> System packages"
sudo dnf update -y
sudo dnf install -y git

echo "==> Node 22"
# AL2023's default repo may only carry nodejs20; engines requires >=22.
sudo dnf install -y nodejs22 nodejs22-npm 2>/dev/null || {
  curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
  sudo dnf install -y nodejs
}
node --version

echo "==> Deploy key for the private repo"
if [ ! -f ~/.ssh/deploy_key ]; then
  ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N "" -C "ellie-api-ec2"
  cat >> ~/.ssh/config <<'SSHCFG'
Host github.com
  IdentityFile ~/.ssh/deploy_key
  IdentitiesOnly yes
SSHCFG
  chmod 600 ~/.ssh/config
fi

echo
echo "=================================================================="
echo "ADD THIS AS A DEPLOY KEY:"
echo "  GitHub repo -> Settings -> Deploy keys -> Add deploy key"
echo "  (read-only is correct; the box never pushes)"
echo
cat ~/.ssh/deploy_key.pub
echo "=================================================================="
echo "Then run: bash ~/app/server/deploy/install.sh"
