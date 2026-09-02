#!/usr/bin/env bash
# Point the SSH rule at wherever you are right now.
# Home ISPs rotate your address; this makes that a 5-second fix.
set -euo pipefail

SG=sg-049e34ec04350e562
REGION=us-east-1

IP=$(curl -s --max-time 10 https://checkip.amazonaws.com | tr -d '[:space:]')
[ -n "$IP" ] || { echo "could not determine public IP"; exit 1; }

RULE=$(aws ec2 describe-security-group-rules --region "$REGION" \
  --filters "Name=group-id,Values=$SG" \
  --query "SecurityGroupRules[?FromPort==\`22\`].SecurityGroupRuleId" --output text)

aws ec2 modify-security-group-rules --region "$REGION" --group-id "$SG" \
  --security-group-rules "SecurityGroupRuleId=$RULE,SecurityGroupRule={IpProtocol=tcp,FromPort=22,ToPort=22,CidrIpv4=${IP}/32,Description=ssh-ethan}" \
  >/dev/null

echo "SSH now allowed from $IP"
