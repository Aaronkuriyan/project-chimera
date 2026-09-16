#!/usr/bin/env bash
# scripts/demo.sh
# Run this against a local (npm run dev) or deployed instance.
# Usage: BASE_URL=http://localhost:3000 bash scripts/demo.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "== 1. Human-looking request (real Chrome UA) =="
curl -s -D - -o /tmp/chimera-human.html \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" \
  -H "Accept-Language: en-US,en;q=0.9" \
  -H "Accept-Encoding: gzip, br" \
  -H "Sec-Fetch-Mode: navigate" \
  "$BASE_URL/article" | grep -i "x-chimera"
echo "Body saved to /tmp/chimera-human.html"
echo

echo "== 2. GPTBot-identified request =="
curl -s -D - -o /tmp/chimera-gptbot.html \
  -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot" \
  "$BASE_URL/article" | grep -i "x-chimera"
echo "Body saved to /tmp/chimera-gptbot.html"
echo

echo "== 3. Generic scraper (curl default UA, no headers) =="
curl -s -D - -o /tmp/chimera-curl.html "$BASE_URL/article" | grep -i "x-chimera"
echo "Body saved to /tmp/chimera-curl.html"
echo

echo "== Diff human vs bot article body =="
diff /tmp/chimera-human.html /tmp/chimera-gptbot.html || true
echo

echo "== 4. Verify: feed the fabricated article body back into /api/verify =="
FABRICATED_TEXT=$(cat /tmp/chimera-gptbot.html)
curl -s -X POST "$BASE_URL/api/verify" \
  -H "Content-Type: application/json" \
  --data-binary @- <<EOF
{"text": $(python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' <<< "$FABRICATED_TEXT")}
EOF
echo
