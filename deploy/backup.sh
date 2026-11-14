#!/bin/sh
# Backup diário do banco (pg_dump -Fc) e das fotos (tar) para /backups.
# Retenção: 7 diários e 4 semanais (copiados aos domingos). Variáveis padrão do
# Postgres (PGHOST, PGUSER, PGPASSWORD, PGDATABASE). BACKUP_ONCE=1 faz uma cópia e sai.
set -eu

BACKUP_ROOT="${BACKUP_ROOT:-/backups}"
UPLOADS_DIR="${UPLOADS_DIR:-/uploads}"
BACKUP_HOUR="${BACKUP_HOUR:-02}"
export TZ="${TZ:-America/Sao_Paulo}"

ping_monitor() {
  [ -n "${HEALTHCHECK_PING_URL:-}" ] || return 0
  wget -q -T 10 -O /dev/null --post-data='' "${HEALTHCHECK_PING_URL}$1" 2>/dev/null || true
}

run_backup() {
  stamp="$(date +%Y%m%d-%H%M%S)"
  daily="$BACKUP_ROOT/daily"
  weekly="$BACKUP_ROOT/weekly"
  mkdir -p "$daily" "$weekly"

  # Escreve em arquivo temporário e só renomeia ao terminar: nunca fica meia cópia.
  pg_dump -Fc --no-owner "$PGDATABASE" > "$daily/.fiscaliza-$stamp.dump.tmp"
  # Confere que o arquivo é um dump legível antes de publicá-lo.
  pg_restore --list "$daily/.fiscaliza-$stamp.dump.tmp" > /dev/null
  mv "$daily/.fiscaliza-$stamp.dump.tmp" "$daily/fiscaliza-$stamp.dump"
  if [ -d "$UPLOADS_DIR" ]; then
    tar -czf "$daily/.uploads-$stamp.tar.gz.tmp" -C "$UPLOADS_DIR" .
    mv "$daily/.uploads-$stamp.tar.gz.tmp" "$daily/uploads-$stamp.tar.gz"
  fi

  # Domingo: guarda também uma cópia semanal.
  if [ "$(date +%u)" = "7" ]; then
    cp "$daily/fiscaliza-$stamp.dump" "$weekly/"
    [ -f "$daily/uploads-$stamp.tar.gz" ] && cp "$daily/uploads-$stamp.tar.gz" "$weekly/"
  fi

  # Retenção
  for prefix in fiscaliza uploads; do
    ls -1t "$daily"/"$prefix"-* 2>/dev/null | tail -n +8 | xargs -r rm -f --
    ls -1t "$weekly"/"$prefix"-* 2>/dev/null | tail -n +5 | xargs -r rm -f --
  done
  echo "[backup] concluído: $stamp"
}

if [ "${BACKUP_ONCE:-0}" = "1" ]; then
  run_backup
  exit 0
fi

echo "[backup] ativo: todo dia às ${BACKUP_HOUR}h (${TZ})"
last_day=""
while true; do
  today="$(date +%Y-%m-%d)"
  hour="$(date +%H)"
  if [ "$today" != "$last_day" ] && [ "$hour" -ge "$BACKUP_HOUR" ]; then
    last_day="$today"
    # `set -e` não vale dentro de uma função chamada como condição de `if`: um
    # pg_dump falho seguiria adiante e o monitor receberia sucesso. Num subshell
    # com `set -e` próprio, o primeiro erro interrompe a cópia.
    set +e
    (set -e; run_backup)
    status=$?
    set -e
    if [ "$status" -eq 0 ]; then ping_monitor ""; else echo "[backup] FALHOU"; rm -f "$BACKUP_ROOT"/daily/.*.tmp; ping_monitor "/fail"; fi
  fi
  sleep 300
done
