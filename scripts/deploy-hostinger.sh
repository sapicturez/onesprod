#!/usr/bin/env bash
# Upload dist/ to Hostinger (onesprod.com) and unpack it into public_html.
# Needs env HOSTINGER_API_TOKEN (GitHub secret). Uses the Hostinger public API
# (same calls as the official @hostinger/mcp "deployStaticWebsite" tool).
set -euo pipefail
API=https://developers.hostinger.com/api/hosting/v1
USERNAME=${HOSTINGER_USERNAME:-u658516812}
DOMAIN=${HOSTINGER_DOMAIN:-onesprod.com}
ARCHIVE=site-$(date +%s).zip
AUTH=(-H "Authorization: Bearer $HOSTINGER_API_TOKEN" -H "Content-Type: application/json")

(cd dist && zip -qr "../$ARCHIVE" .)
SIZE=$(stat -c%s "$ARCHIVE"); echo "Archive $ARCHIVE: $SIZE bytes"

CREDS=$(curl -fsS -X POST "$API/files/upload-urls" "${AUTH[@]}" -d "{\"username\":\"$USERNAME\",\"domain\":\"$DOMAIN\"}")
URL=$(jq -r .url <<<"$CREDS"); XA=$(jq -r .auth_key <<<"$CREDS"); XR=$(jq -r .rest_auth_key <<<"$CREDS")
TARGET="${URL%/}/$ARCHIVE?override=true"
TUS=(-H "X-Auth: $XA" -H "X-Auth-Rest: $XR" -H "Tus-Resumable: 1.0.0")

curl -fsS -o /dev/null -X POST "$TARGET" "${TUS[@]}" -H "Upload-Length: $SIZE" -H "Upload-Offset: 0"
split -b 10485760 -d -a 3 "$ARCHIVE" chunk.
OFFSET=0
for f in chunk.*; do
  for try in 1 2 3 4 5; do
    NEW=$(curl -sS -m 300 -D - -o /dev/null -X PATCH "$TARGET" "${TUS[@]}" \
      -H "Content-Type: application/offset+octet-stream" -H "Upload-Offset: $OFFSET" \
      --data-binary "@$f" | tr -d '\r' | awk 'tolower($1)=="upload-offset:"{print $2}') || true
    [ -n "$NEW" ] && break; echo "retry $f ($try)"; sleep $((try*5))
  done
  [ -n "$NEW" ] || { echo "Upload failed at $OFFSET"; exit 1; }
  OFFSET=$NEW; echo "uploaded $OFFSET / $SIZE"
done
[ "$OFFSET" = "$SIZE" ] || { echo "Size mismatch"; exit 1; }

curl -fsS -X POST "$API/accounts/$USERNAME/websites/$DOMAIN/deploy" "${AUTH[@]}" -d "{\"archive_path\":\"$ARCHIVE\"}"
echo; echo "Deploy triggered for $DOMAIN"
sleep 20
curl -fsS -X DELETE "$API/accounts/$USERNAME/websites/$DOMAIN/cache/clear" "${AUTH[@]}" && echo "Hostinger cache cleared" || echo "cache clear failed (non-fatal)"
