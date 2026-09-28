#!/usr/bin/env bash
# Prueba de extremo a extremo del flujo de LeadScout contra localhost:3000.
# Uso: ./scripts/e2e.sh
set -uo pipefail

BASE="http://localhost:3000"
JAR=$(mktemp)
PASS=0
FAIL=0

ok()   { echo "  PASS  $1"; PASS=$((PASS+1)); }
bad()  { echo "  FAIL  $1"; FAIL=$((FAIL+1)); }
check(){ if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (esperado=$3 obtenido=$2)"; fi; }

echo "== 1. Landing =="
code=$(curl -s -o /tmp/e2e.html -w '%{http_code}' "$BASE/")
check "la landing responde 200" "$code" "200"
if grep -q "Enter your website URL" /tmp/e2e.html; then ok "el input de URL está en el HTML"; else bad "falta el input de URL"; fi
if grep -q 'class="min-h-screen bg-bg' /tmp/e2e.html; then ok "el body lleva bg-bg (fondo verde)"; else bad "el body no lleva bg-bg"; fi

echo "== 2. Validación de URL =="
for bad_url in "no-es-un-dominio" "hola@" "mi web.com" "1234"; do
  resp=$(curl -s -m 30 -X POST "$BASE/api/scan" -H 'Content-Type: application/json' \
    -d "{\"url\":\"$bad_url\"}")
  if echo "$resp" | grep -q '"error"'; then ok "rechaza '$bad_url'"; else bad "aceptó '$bad_url'"; fi
done

echo "== 3. Preview anónimo (pixelado) =="
anon=$(curl -s -m 90 -X POST "$BASE/api/scan" -H 'Content-Type: application/json' -d '{"url":"stripe.com"}')
echo "$anon" > /tmp/e2e-anon.json
if echo "$anon" | grep -q '"unlocked":false'; then ok "el anónimo llega bloqueado"; else bad "el anónimo no debería estar desbloqueado"; fi
if echo "$anon" | grep -q 'nameMasked'; then ok "los nombres van enmascarados"; else bad "faltan los nombres enmascarados"; fi
if echo "$anon" | grep -q 'matchScore'; then ok "el % de match viaja claro (el gancho)"; else bad "falta matchScore"; fi
# La fuga importante: los leads del anónimo NO pueden llevar url/username/snippet/reason.
leak=$(node -e "
const d = JSON.parse(require('fs').readFileSync('/tmp/e2e-anon.json','utf8'));
const bad = d.leads.filter(l => ['url','username','snippet','reason'].some(k => k in l));
console.log(bad.length);
")
check "ningún lead anónimo lleva url/username/snippet/reason" "$leak" "0"
# Y el % de match debe seguir visible en todos.
mismatch=$(node -e "
const d = JSON.parse(require('fs').readFileSync('/tmp/e2e-anon.json','utf8'));
console.log(d.leads.filter(l => typeof l.matchScore === 'number' && l.matchScore > 0).length);
")
check "todos los leads anónimos traen su % de match" "$mismatch" "$(node -e "
const d = JSON.parse(require('fs').readFileSync('/tmp/e2e-anon.json','utf8'));
console.log(d.leads.length);
")"
search_id=$(echo "$anon" | grep -oE '"searchId":"[^"]+"' | head -1 | cut -d'"' -f4)
echo "        searchId=$search_id"

echo "== 4. Registro =="
EMAIL="e2e-$(date +%s)@leadscout.test"
reg=$(curl -s -m 30 -c "$JAR" -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"mode\":\"signup\",\"email\":\"$EMAIL\",\"password\":\"pruebalocal123\"}")
if echo "$reg" | grep -q '"user"'; then ok "registro creado ($EMAIL)"; else bad "fallo el registro: $reg"; fi
if echo "$reg" | grep -q 'passwordHash'; then bad "FUGA: el registro devuelve passwordHash"; else ok "el registro no filtra passwordHash"; fi

echo "== 5. Sesión =="
sess=$(curl -s -m 20 -b "$JAR" "$BASE/api/auth/session")
if echo "$sess" | grep -q "$EMAIL"; then ok "la sesión reconoce al usuario"; else bad "no hay sesión: $sess"; fi
if echo "$sess" | grep -q 'passwordHash'; then bad "FUGA: /session devuelve passwordHash"; else ok "/session no filtra passwordHash"; fi
if echo "$sess" | grep -q '"quota"'; then ok "la sesión trae la cuota"; else bad "falta la cuota"; fi

echo "== 6. Login repetido, auto-fallback y password incorrecto =="
dup=$(curl -s -m 30 -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"mode\":\"signup\",\"email\":\"$EMAIL\",\"password\":\"pruebalocal123\"}")
if echo "$dup" | grep -q '"user"'; then ok "'crear cuenta' con email existente inicia sesión"; else bad "el duplicado debía iniciar sesión: $dup"; fi
wrong=$(curl -s -m 30 -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"mode\":\"login\",\"email\":\"$EMAIL\",\"password\":\"claveequivocada\"}")
if echo "$wrong" | grep -q 'incorrecta'; then ok "rechaza la contraseña incorrecta"; else bad "aceptó la contraseña incorrecta: $wrong"; fi
fresh=$(curl -s -m 30 -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"mode\":\"login\",\"email\":\"nuevo-$(date +%s)@leadscout.test\",\"password\":\"pruebalocal123\"}")
if echo "$fresh" | grep -q '"user"'; then ok "'iniciar sesión' con email nuevo crea la cuenta"; else bad "no creó la cuenta: $fresh"; fi
short=$(curl -s -m 30 -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"mode\":\"signup\",\"email\":\"x@y.com\",\"password\":\"corta\"}")
if echo "$short" | grep -q '8 caracteres'; then ok "exige contraseña de 8+ caracteres"; else bad "no valida la longitud: $short"; fi

echo "== 7. Scan autenticado =="
auth=$(curl -s -m 90 -b "$JAR" -X POST "$BASE/api/scan" -H 'Content-Type: application/json' -d '{"url":"stripe.com"}')
if echo "$auth" | grep -q '"unlocked":true'; then ok "el usuario registrado recibe leads completos"; else bad "los leads no llegan desbloqueados"; fi
if echo "$auth" | grep -q '"url":"https://www.reddit.com'; then ok "el lead trae su url real"; else bad "falta la url del lead"; fi
lead_id=$(echo "$auth" | grep -oE '"id":"lead_[^"]+"' | head -1 | cut -d'"' -f4)
echo "        leadId=$lead_id"

echo "== 8. Aislamiento entre usuarios =="
JAR2=$(mktemp)
curl -s -m 30 -c "$JAR2" -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"mode\":\"signup\",\"email\":\"otro-$(date +%s)@leadscout.test\",\"password\":\"pruebalocal123\"}" > /dev/null
steal=$(curl -s -m 30 -b "$JAR2" -X POST "$BASE/api/messages" -H 'Content-Type: application/json' \
  -d "{\"leadId\":\"$lead_id\"}")
if echo "$steal" | grep -q 'no es tuyo'; then ok "un usuario no puede usar el lead de otro"; else bad "FUGA: pudo usar el lead ajeno: $steal"; fi

echo "== 9. Generador de mensajes (ilimitados por ahora) =="
for i in 1 2 3 4; do
  r=$(curl -s -m 60 -b "$JAR" -X POST "$BASE/api/messages" -H 'Content-Type: application/json' -d "{\"leadId\":\"$lead_id\"}")
  if echo "$r" | grep -q '"message"'; then ok "mensaje $i generado"; else bad "mensaje $i falló: $r"; fi
done
body=$(echo "$r" | grep -oE '"body":"[^"]{10,}"' | head -1)
if [ -n "$body" ]; then ok "el mensaje tiene contenido real"; else bad "el mensaje está vacío"; fi
limit=$(echo "$r" | grep -oE '"limit":null' | head -1)
if [ "$limit" = '"limit":null' ]; then ok "no hay tope de mensajes (limit null)"; else bad "el límite no es null: $r"; fi

echo "== 10. Editar mensajes y sesión sin tope =="
msg_id=$(echo "$r" > /dev/null; curl -s -m 20 -b "$JAR" "$BASE/api/messages" | grep -oE '"id":"msg_[^"]+"' | head -1 | cut -d'"' -f4)
ed=$(curl -s -m 30 -b "$JAR" -X PATCH "$BASE/api/messages" -H 'Content-Type: application/json' \
  -d "{\"id\":\"$msg_id\",\"text\":\"Mensaje editado a mano por el usuario.\"}")
if echo "$ed" | grep -q 'editado a mano'; then ok "guarda la edición del usuario"; else bad "no guardó la edición: $ed"; fi
sesslim=$(curl -s -m 20 -b "$JAR" "$BASE/api/auth/session" | grep -oE '"limit":null' | head -1)
if [ "$sesslim" = '"limit":null' ]; then ok "la sesión sigue con límite null (ilimitado)"; else bad "la cuota de la sesión no es ilimitada: $sesslim"; fi

echo "== 11. Dashboard protegido =="
code=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$BASE/dashboard")
if [ "$code" = "307" ] || [ "$code" = "302" ] || [ "$code" = "303" ]; then ok "el anónimo es redirigido (code $code)"; else bad "el anónimo no fue redirigido (code $code)"; fi
code=$(curl -s -o /dev/null -m 20 -b "$JAR" -w '%{http_code}' "$BASE/dashboard")
check "el registrado entra al dashboard" "$code" "200"

echo "== 12. Logout =="
# OJO: -b solo LEE el jar; hace falta -c para que curl guarde el borrado.
curl -s -m 20 -b "$JAR" -c "$JAR" -X POST "$BASE/api/auth/logout" > /dev/null
sess2=$(curl -s -m 20 -b "$JAR" "$BASE/api/auth/session")
if echo "$sess2" | grep -q '"user":null'; then ok "el logout cierra la sesión"; else bad "el logout no cerró la sesión: $sess2"; fi

rm -f "$JAR" "$JAR2"
echo
echo "================================"
echo "  PASS: $PASS   FAIL: $FAIL"
echo "================================"
[ "$FAIL" -eq 0 ]
