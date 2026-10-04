#!/usr/bin/env bash
# Publica a versao COMMITADA (HEAD) no servidor. Corre a partir do PC (Git Bash):
#   bash deploy/publicar.sh <IP>                 -> publica backend + app + admin
#   bash deploy/publicar.sh <IP> --primeira-vez <EMAIL>   -> prepara o servidor antes
# Usa a chave ~/.ssh/genesis_do. So vai o que esta no git (nunca .env, dev.db, logs).
# Troca de versao com rollback: se o backend novo nao responder, volta ao anterior.
set -euo pipefail
IP="${1:?IP do servidor em falta}"
MODE="${2:-}"
EMAIL="${3:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DASHED="${IP//./-}"
APP_HOST="${APP_HOST:-${DASHED}.sslip.io}"
ADMIN_HOST="${ADMIN_HOST:-admin.${DASHED}.sslip.io}"
SSH="ssh -i $HOME/.ssh/genesis_do -o StrictHostKeyChecking=accept-new root@${IP}"

cd "$ROOT"
if [ -n "$(git status --porcelain)" ]; then
  echo "AVISO: ha alteracoes por commitar; so o HEAD ($(git rev-parse --short HEAD)) e publicado."
fi
REV="$(git rev-parse --short HEAD)"

if [ "$MODE" = "--primeira-vez" ]; then
  [ -n "$EMAIL" ] || { echo "falta o email para o certificado HTTPS"; exit 1; }
  echo "== a preparar o servidor ($APP_HOST, $ADMIN_HOST)"
  $SSH "rm -rf /tmp/genesis-deploy && mkdir -p /tmp/genesis-deploy"
  tar -C deploy -cz setup_servidor.sh genesis-backend.service nginx.conf | $SSH "tar -xz -C /tmp/genesis-deploy"
  $SSH "bash /tmp/genesis-deploy/setup_servidor.sh '$APP_HOST' '$ADMIN_HOST' '$EMAIL'"
  echo "== .env de producao (gerado aqui, enviado cifrado pelo SSH, nunca mostrado)"
  TMPENV="$(mktemp)"
  node deploy/gerar_env_producao.js "$APP_HOST" "$ADMIN_HOST" "$TMPENV"
  $SSH "install -o genesis -g genesis -m 600 /dev/stdin /srv/genesis/backend.env" < "$TMPENV"
  rm -f "$TMPENV"
fi

echo "== builds dos dois frontends ($REV)"
(cd frontend && npm run build >/dev/null)
(cd admin-frontend && npm run build >/dev/null)
# O bundle da app nunca pode levar codigo do admin.
if grep -rlq "/api/admin/tenants" frontend/dist/assets; then echo "ERRO: codigo admin no bundle da app"; exit 1; fi

echo "== backend ($REV) -> /srv/genesis/backend.new"
$SSH "rm -rf /srv/genesis/backend.new && mkdir -p /srv/genesis/backend.new"
git archive HEAD backend | $SSH "tar -x --strip-components=1 -C /srv/genesis/backend.new"
$SSH "set -e; cd /srv/genesis/backend.new && rm -f prisma/dev.db && cp /srv/genesis/backend.env .env && chmod 600 .env \
  && chown -R genesis:genesis /srv/genesis/backend.new \
  && sudo -u genesis -H npm ci --omit=dev --no-audit --no-fund >/tmp/genesis-npm.log 2>&1 || { tail -20 /tmp/genesis-npm.log; exit 1; }"

echo "== frontends -> app.new / admin.new"
$SSH "rm -rf /srv/genesis/app.new /srv/genesis/admin.new && mkdir -p /srv/genesis/app.new /srv/genesis/admin.new"
tar -C frontend/dist -cz . | $SSH "tar -xz -C /srv/genesis/app.new"
tar -C admin-frontend/dist -cz . | $SSH "tar -xz -C /srv/genesis/admin.new"

echo "== troca de versao + verificacao"
$SSH "set -e; cd /srv/genesis
  rm -rf backend.old app.old admin.old
  [ -d backend/src ] && mv backend backend.old || rm -rf backend
  mv backend.new backend
  [ -d app ] && mv app app.old || true; mv app.new app
  [ -d admin ] && mv admin admin.old || true; mv admin.new admin
  echo $REV > /srv/genesis/VERSION
  systemctl restart genesis-backend
  for i in \$(seq 1 45); do curl -fsS -o /dev/null http://127.0.0.1:4000/ && break; sleep 2; done
  if ! curl -fsS -o /dev/null http://127.0.0.1:4000/; then
    echo 'FALHOU: o backend novo nao respondeu. Log:'; journalctl -u genesis-backend -n 30 --no-pager
    if [ -d backend.old ]; then rm -rf backend && mv backend.old backend && systemctl restart genesis-backend && echo 'Voltou a versao anterior.'; fi
    exit 1
  fi
  echo backend OK"
echo "PUBLICADO $REV: https://${APP_HOST}  |  admin: https://${ADMIN_HOST}"
