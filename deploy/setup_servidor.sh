#!/usr/bin/env bash
# Preparacao UNICA de um servidor Ubuntu 24.04 (DigitalOcean FRA1) para o Genesis.
# Corre como root:  bash setup_servidor.sh <APP_HOST> <ADMIN_HOST> <EMAIL_CERTBOT>
#   ex.: bash setup_servidor.sh 164-90-1-2.sslip.io admin.164-90-1-2.sslip.io dono@exemplo.com
# Idempotente: pode correr outra vez sem estragar nada.
set -euo pipefail
APP_HOST="${1:?APP_HOST em falta}"
ADMIN_HOST="${2:?ADMIN_HOST em falta}"
EMAIL="${3:?email para o certificado em falta}"
export DEBIAN_FRONTEND=noninteractive

echo "== pacotes"
apt-get update -q
apt-get install -yq ca-certificates curl gnupg nginx certbot python3-certbot-nginx ufw unattended-upgrades
if ! command -v node >/dev/null || ! node -v | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -yq nodejs
fi
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "== swap (2 GB: o npm ci e o prisma generate precisam de memoria num servidor de 1 GB)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "== firewall: so SSH, HTTP e HTTPS (o backend fica em 127.0.0.1:4000, invisivel de fora)"
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable

echo "== SSH so com chave"
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload ssh || systemctl reload sshd

echo "== utilizador e pastas"
id genesis >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin genesis
mkdir -p /srv/genesis/backend /srv/genesis/app /srv/genesis/admin
chown -R genesis:genesis /srv/genesis/backend

echo "== servico do backend"
install -m 644 /tmp/genesis-deploy/genesis-backend.service /etc/systemd/system/genesis-backend.service
systemctl daemon-reload
systemctl enable genesis-backend

echo "== nginx"
sed -e "s/__APP_HOST__/${APP_HOST}/g" -e "s/__ADMIN_HOST__/${ADMIN_HOST}/g" /tmp/genesis-deploy/nginx.conf > /etc/nginx/sites-available/genesis
ln -sf /etc/nginx/sites-available/genesis /etc/nginx/sites-enabled/genesis
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "== HTTPS (Let's Encrypt; renova sozinho)"
certbot --nginx --non-interactive --agree-tos -m "$EMAIL" --redirect -d "$APP_HOST" -d "$ADMIN_HOST"
systemctl reload nginx

echo "PRONTO: https://${APP_HOST}  e  https://${ADMIN_HOST}"
