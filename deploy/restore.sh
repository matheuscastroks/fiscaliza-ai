#!/usr/bin/env bash
# Restaura um backup do Fiscaliza aí.
#
#   deploy/restore.sh <fiscaliza-*.dump> [uploads-*.tar.gz]
#
# Variáveis: COMPOSE (padrão: "docker compose"), DB (padrão: fiscaliza_restore).
# Por segurança restaura num banco NOVO (DB). Para substituir a produção, pare a
# API, restaure em DB=fiscaliza e suba de novo. Nunca roda sem confirmação a menos
# que RESTORE_YES=1.
set -euo pipefail

dump="${1:?Informe o arquivo .dump}"
uploads="${2:-}"
compose="${COMPOSE:-docker compose}"
db="${DB:-fiscaliza_restore}"
[ -f "$dump" ] || { echo "Arquivo não encontrado: $dump" >&2; exit 1; }

if [ "$db" = "fiscaliza" ] && [ "${RESTORE_YES:-0}" != "1" ]; then
  read -r -p "Isto substitui o banco de produção 'fiscaliza'. Digite SUBSTITUIR para continuar: " answer
  [ "$answer" = "SUBSTITUIR" ] || { echo "Cancelado."; exit 1; }
fi

$compose exec -T postgres psql -U fiscaliza -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"$db\"" -c "CREATE DATABASE \"$db\""
$compose exec -T postgres pg_restore -U fiscaliza -d "$db" --no-owner --exit-on-error < "$dump"
echo "Banco restaurado em '$db'."

if [ -n "$uploads" ]; then
  [ -f "$uploads" ] || { echo "Arquivo não encontrado: $uploads" >&2; exit 1; }
  $compose run --rm --no-deps -T -v "$(cd "$(dirname "$uploads")" && pwd):/restore:ro" \
    --entrypoint sh api -c "tar -xzf /restore/$(basename "$uploads") -C /app/uploads"
  echo "Fotos restauradas em /app/uploads."
fi
