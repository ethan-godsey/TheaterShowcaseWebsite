#!/usr/bin/env bash
# Fetch a real Cognito access token for testing the API from curl.
#
# Walks the same Authorization Code + PKCE flow the browser will use, so if
# this works, the pool config is correct. Run from anywhere:
#   bash scripts/get-token.sh
set -euo pipefail

DOMAIN="https://us-east-1vep6zbjih.auth.us-east-1.amazoncognito.com"
CLIENT_ID="ddfudshe7ahe9bgf9msv43de4"
REDIRECT="http://localhost:5173/callback"

# ── PKCE ────────────────────────────────────────────────────────────────
# verifier: the secret. challenge: its SHA-256, base64url-encoded.
# We send the challenge up front and reveal the verifier only at exchange —
# so an intercepted authorization code is useless without it.
VERIFIER=$(openssl rand -base64 60 | tr -d '\n=+/' | cut -c1-64)
CHALLENGE=$(printf '%s' "$VERIFIER" \
  | openssl dgst -binary -sha256 \
  | openssl base64 \
  | tr -d '=\n' | tr '/+' '_-')

AUTH_URL="${DOMAIN}/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT}&scope=openid+email&code_challenge=${CHALLENGE}&code_challenge_method=S256"

echo
echo "1. Open this in a browser and sign in:"
echo
echo "$AUTH_URL"
echo
echo "   (First sign-in forces a password change — that clears FORCE_CHANGE_PASSWORD.)"
echo
echo "2. You'll land on a dead localhost URL. That's expected — nothing is"
echo "   listening at /callback yet. Copy the value of ?code= from the address bar."
echo
read -r -p "Paste the code here: " CODE

RESPONSE=$(curl -s -X POST "${DOMAIN}/oauth2/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=authorization_code" \
  -d "client_id=${CLIENT_ID}" \
  -d "code=${CODE}" \
  -d "redirect_uri=${REDIRECT}" \
  -d "code_verifier=${VERIFIER}")

if echo "$RESPONSE" | grep -q '"error"'; then
  echo
  echo "Exchange failed:"
  echo "$RESPONSE"
  echo
  echo "  invalid_grant        -> code already used, or expired (they last ~60s)"
  echo "  redirect_mismatch    -> redirect_uri must match the pool EXACTLY"
  exit 1
fi

ACCESS=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

echo
echo "=== ACCESS TOKEN (send this to your API) ==="
echo "$ACCESS"
echo
echo "=== payload ==="
echo "$ACCESS" | cut -d. -f2 | tr '_-' '/+' | base64 -d 2>/dev/null | python3 -m json.tool 2>/dev/null || true
echo
echo "=== test your API ==="
echo "curl -i -X POST http://localhost:3000/api/media \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -d '{\"kind\":\"reel\",\"title\":\"auth test\",\"embedUrl\":\"https://player.vimeo.com/video/1\"}'"
