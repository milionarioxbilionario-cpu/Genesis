#!/usr/bin/env bash
set -euo pipefail

# ===========================================================================
#  GESTAO DE CONTAS E SENHAS - Linux / macOS
#  Executa:  ./gerir-contas.sh
#
#  As senhas do Genesis estao em bcrypt (custo 12): hash de sentido unico,
#  nao se "desencripta". O script lista as contas, mostra a que conta pertence
#  cada senha do .env, e deixa verificar/definir/gerar senhas novas.
# ===========================================================================

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  ERRO: nao encontrei o Node.js nesta maquina."
  echo "  Instala o Node.js 18+ (apt install nodejs / brew install node) e repete."
  echo
  exit 1
fi

if [ ! -d "backend/node_modules/bcrypt" ]; then
  echo
  echo "  ERRO: falta o backend/node_modules. Corre primeiro:"
  echo "    cd backend && npm install"
  echo
  exit 1
fi

# O script compara as senhas do .env com TODAS as contas (bcrypt custo 12),
# e isso sao dezenas de comparacoes. Mais threads = muito mais rapido.
export UV_THREADPOOL_SIZE=16

echo
echo "  A ligar a base de dados e a listar as contas..."
echo

cd backend
exec node scripts/gerir_contas.js "$@"
