#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
exec ./run-local.sh "$@"
