#!/usr/bin/env bash
# ==============================================================================
# RBAC IRON WALL — end-to-end verification against the live Express server.
# Usage: bash scripts/verify-iron-wall.sh   (server must be on 127.0.0.1:3000)
# Every login varies x-forwarded-for to dodge the sliding-window rate limiter.
# ==============================================================================
BASE="http://127.0.0.1:3000"
PASS=0
FAIL=0

ok()   { echo "  ✅ PASS — $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ FAIL — $1"; FAIL=$((FAIL+1)); }
info() { echo "  ℹ️  $1"; }

# login <email> <password> <x-forwarded-for> -> prints token
login() {
  curl -s -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -H "x-forwarded-for: $3" \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    -c /tmp/ck_$3.txt
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 1. AUTHENTICATION — branch masters + super master"
echo "═══════════════════════════════════════════════════════════════"

DR_JSON=$(login "digitalrace.master@ceyteq.com" "DigitalRace@2026!" "10.0.0.1")
TT_JSON=$(login "tastetrip.master@ceyteq.com"   "TasteTrip@2026!"   "10.0.0.2")
SU_JSON=$(login "Info.ceyteq@gmail.com"         "admin@ceyteq2026"  "10.0.0.3")

DR_TOKEN=$(echo "$DR_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("token",""))' 2>/dev/null)
TT_TOKEN=$(echo "$TT_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("token",""))' 2>/dev/null)
SU_TOKEN=$(echo "$SU_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("token",""))' 2>/dev/null)

DR_ROLE=$(echo "$DR_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("user",{}).get("role",""))' 2>/dev/null)
TT_ROLE=$(echo "$TT_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("user",{}).get("role",""))' 2>/dev/null)
SU_ROLE=$(echo "$SU_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("user",{}).get("role",""))' 2>/dev/null)

[ -n "$DR_TOKEN" ] && ok "DR master login (role=$DR_ROLE)"     || bad "DR master login"
[ -n "$TT_TOKEN" ] && ok "TT master login (role=$TT_ROLE)"     || bad "TT master login"
[ -n "$SU_TOKEN" ] && ok "Super master login (role=$SU_ROLE)"  || bad "Super master login"

# Branch masters must NOT be elevated to SUPER_MASTER_ADMIN
[ "$DR_ROLE" = "DIGITAL_RACE_MASTER" ] && ok "DR master keeps DIGITAL_RACE_MASTER (no elevation)" || bad "DR role elevated to $DR_ROLE"
[ "$TT_ROLE" = "TASTETRIP_MASTER" ]    && ok "TT master keeps TASTETRIP_MASTER (no elevation)"    || bad "TT role elevated to $TT_ROLE"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 2. GET /api/admins — ZERO cross-branch rows"
echo "═══════════════════════════════════════════════════════════════"

count_admins() { # $1 = token, $2 = forbidden branch
  curl -s "$BASE/api/admins" -H "Authorization: Bearer $1" -H "x-forwarded-for: $3" \
    | python3 -c "
import sys,json
d=json.load(sys.stdin)
admins=d.get('admins',[])
bad=[a['email'] for a in admins if (a.get('platformBranch') or '').upper()=='$2']
print(f\"{d.get('count',0)} {len(bad)} {'|'.join(bad)}\")
"
}

read DR_CNT DR_BAD DR_BADLIST <<< "$(count_admins "$DR_TOKEN" "TASTETRIP" "10.0.1.1")"
read TT_CNT TT_BAD TT_BADLIST <<< "$(count_admins "$TT_TOKEN" "DIGITAL_RACE" "10.0.1.2")"
read SU_CNT SU_BAD SU_BADLIST <<< "$(count_admins "$SU_TOKEN" "NOPE" "10.0.1.3")"

info "DR master sees $DR_CNT admins · TT master sees $TT_CNT · Super sees $SU_CNT"
[ "$DR_BAD" = "0" ] && ok "DR master: 0 TasteTrip rows"  || bad "DR master leaked TT rows: $DR_BADLIST"
[ "$TT_BAD" = "0" ] && ok "TT master: 0 Digital Race rows" || bad "TT master leaked DR rows: $TT_BADLIST"
[ "$DR_CNT" -gt 0 ] && ok "DR master still sees his own admins ($DR_CNT)" || bad "DR master sees 0 admins"
[ "$TT_CNT" -gt 0 ] && ok "TT master still sees her own admins ($TT_CNT)" || bad "TT master sees 0 admins"
[ "$SU_CNT" -eq 11 ] && ok "Super master sees all 11 admins" || bad "Super sees $SU_CNT (expected 11)"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 3. GET /api/master/tenants (-scoped) — branch filtered"
echo "═══════════════════════════════════════════════════════════════"

tenant_count() { # $1 token $2 ip $3 path
  curl -s "$BASE$3" -H "Authorization: Bearer $1" -H "x-forwarded-for: $2" \
    | python3 -c 'import sys,json;print(json.load(sys.stdin).get("count","ERR"))' 2>/dev/null
}

DR_T=$(tenant_count "$DR_TOKEN" "10.0.2.1" "/api/master/tenants")
TT_T=$(tenant_count "$TT_TOKEN" "10.0.2.2" "/api/master/tenants")
SU_T=$(tenant_count "$SU_TOKEN" "10.0.2.3" "/api/master/tenants")
TT_S=$(tenant_count "$TT_TOKEN" "10.0.2.4" "/api/master/tenants-scoped")

info "tenants → DR:$DR_T  TT:$TT_T  Super:$SU_T   tenants-scoped TT:$TT_S"
[ "$TT_T" = "0" ] && ok "TT master: 0 restaurant tenants (/api/master/tenants)" || bad "TT master sees $TT_T tenants (expected 0)"
[ "$DR_T" != "0" ] && ok "DR master sees restaurant tenants ($DR_T)" || bad "DR master sees 0 tenants"
[ "$SU_T" != "0" ] && ok "Super master sees restaurant tenants ($SU_T)" || bad "Super sees 0 tenants"
[ "$TT_S" = "0" ] && ok "TT master: 0 tenants (/api/master/tenants-scoped)" || bad "TT master scoped sees $TT_S (expected 0)"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 4. PUT /api/admins/:id password change — ERR_SUPER_ONLY"
echo "═══════════════════════════════════════════════════════════════"

TARGET=$(curl -s "$BASE/api/admins" -H "Authorization: Bearer $DR_TOKEN" -H "x-forwarded-for: 10.0.3.0" \
  | python3 -c 'import sys,json;a=json.load(sys.stdin)["admins"];print(next((x["id"] for x in a if x["role"]=="DIVISION_ADMIN"),""))')

if [ -z "$TARGET" ]; then
  bad "could not resolve a DR division admin to target"
else
  RESP=$(curl -s -o /tmp/put.json -w "%{http_code}" -X PUT "$BASE/api/admins/$TARGET" \
    -H "Authorization: Bearer $DR_TOKEN" -H "Content-Type: application/json" \
    -H "x-forwarded-for: 10.0.3.1" -d '{"password":"hacked123!"}')
  CODE=$(python3 -c 'import json;print(json.load(open("/tmp/put.json")).get("code",""))' 2>/dev/null)
  [ "$RESP" = "403" ] && ok "DR master password change → 403" || bad "DR password change returned $RESP"
  [ "$CODE" = "ERR_SUPER_ONLY" ] && ok "error code is ERR_SUPER_ONLY" || bad "error code is '$CODE'"

  # Super master CAN change it
  RESP2=$(curl -s -o /tmp/put2.json -w "%{http_code}" -X PUT "$BASE/api/admins/$TARGET" \
    -H "Authorization: Bearer $SU_TOKEN" -H "Content-Type: application/json" \
    -H "x-forwarded-for: 10.0.3.2" -d '{"password":"admin2026!"}')
  [ "$RESP2" = "200" ] && ok "Super master password change → 200" || bad "Super password change returned $RESP2"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 5. /api/super/* — real session required, super-only"
echo "═══════════════════════════════════════════════════════════════"

hit() { # $1 path $2 token $3 ip  -> "HTTPCODE body"
  if [ -z "$2" ]; then
    curl -s -o /tmp/s.json -w "%{http_code}" -X POST "$BASE$1" \
      -H "Content-Type: application/json" -H "x-forwarded-for: $3" -d '{}'
  else
    curl -s -o /tmp/s.json -w "%{http_code}" -X POST "$BASE$1" \
      -H "Authorization: Bearer $2" -H "Content-Type: application/json" \
      -H "x-forwarded-for: $3" -d '{}'
  fi
}

for EP in /api/super/reset-management-password /api/super/clear-demo-data; do
  C_DR=$(hit "$EP" "$DR_TOKEN" "10.0.4.1")
  C_TT=$(hit "$EP" "$TT_TOKEN" "10.0.4.2")
  C_SU=$(hit "$EP" "$SU_TOKEN" "10.0.4.3")
  MSG=$(python3 -c 'import json;print(json.load(open("/tmp/s.json")).get("message",""))' 2>/dev/null)
  [ "$C_DR" = "403" ] && ok "$EP → 403 for DR master" || bad "$EP → $C_DR for DR master (want 403)"
  [ "$C_TT" = "403" ] && ok "$EP → 403 for TT master" || bad "$EP → $C_TT for TT master (want 403)"
  [ "$C_SU" = "200" ] && ok "$EP → 200 for Super master" || bad "$EP → $C_SU for Super (want 200)"
  [ -n "$MSG" ] && info "super response message: $MSG"
done

echo ""
echo "  --- role-header spoofing (no real session) ---"
SPOOF=$(curl -s -o /tmp/sp.json -w "%{http_code}" -X POST "$BASE/api/super/clear-demo-data" \
  -H "Content-Type: application/json" -H "x-client-role: SUPER_MASTER_ADMIN" \
  -H "x-forwarded-for: 10.0.5.1" -d '{}')
SPOOF_ERR=$(python3 -c 'import json;print(json.load(open("/tmp/sp.json")).get("error",""))' 2>/dev/null)
[ "$SPOOF" = "403" ] && ok "x-client-role SUPER_MASTER_ADMIN spoof → 403" || bad "spoof returned $SPOOF (want 403)"
[ "$SPOOF_ERR" = "Unauthorized Action" ] && ok "spoof body is 'Unauthorized Action'" || bad "spoof body error='$SPOOF_ERR'"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 6. REGRESSION CHECKS"
echo "═══════════════════════════════════════════════════════════════"

HEALTH=$(curl -s "$BASE/api/health" -H "x-forwarded-for: 10.0.6.1" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin).get("status",""))' 2>/dev/null)
[ "$HEALTH" = "ok" ] && ok "/api/health ok" || bad "/api/health returned '$HEALTH'"

PRODS=$(curl -s "$BASE/api/public/menu/ceylon-spice" -H "x-forwarded-for: 10.0.6.2" \
  | python3 -c '
import sys,json
d=json.load(sys.stdin)
t=d.get("tenant",d)
# "categories" is a list of category NAME strings; products live in t["products"]
print(len(t.get("products",[]) or []))
' 2>/dev/null)
[ "$PRODS" = "8" ] && ok "/api/public/menu/ceylon-spice → 8 products" || bad "menu product count = '$PRODS' (want 8)"

CHAT_CODE=$(curl -s -o /tmp/chat.json -w "%{http_code}" -X POST "$BASE/api/ai/chat" \
  -H "Content-Type: application/json" -H "x-forwarded-for: 10.0.6.3" \
  -d '{"message":"hello","history":[]}')
[ "$CHAT_CODE" = "200" ] && ok "/api/ai/chat → 200 (Jasmine untouched)" || bad "/api/ai/chat returned $CHAT_CODE"

ORD=$(curl -s -o /tmp/ord.json -w "%{http_code}" -X POST "$BASE/api/public/orders" \
  -H "Content-Type: application/json" -H "x-forwarded-for: 10.0.6.4" \
  -d '{"tenantSlug":"ceylon-spice","table":7,"items":[{"productId":"p-1","quantity":1}],"customerName":"Verify Bot"}')
[ "$ORD" = "200" ] || [ "$ORD" = "201" ] && ok "POST /api/public/orders → $ORD (KOT path alive)" || bad "order creation returned $ORD"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  RESULT:  $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════════════════════"
echo ""
[ "$FAIL" -eq 0 ] || exit 1
