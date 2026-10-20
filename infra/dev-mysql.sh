#!/usr/bin/env bash
# Starts a private, throwaway MySQL on 127.0.0.1:3307 (no root password needed, no sudo).
# Data lives in /tmp/ilmpath-mysql and is lost on reboot; re-run this script to recreate it.
set -e
D=/tmp/ilmpath-mysql
S=$D/mysql.sock
if ! mysqladmin -uroot -S "$S" ping >/dev/null 2>&1; then
  if [ ! -d "$D/data" ]; then mkdir -p "$D" && mysqld --no-defaults --initialize-insecure --datadir="$D/data" --log-error="$D/init.log" >/dev/null 2>&1; fi
  nohup mysqld --no-defaults --datadir="$D/data" --port=3307 --bind-address=127.0.0.1 --socket="$S" --mysqlx=OFF --pid-file="$D/mysql.pid" --log-error="$D/server.log" >/dev/null 2>&1 &
  for _ in $(seq 1 30); do mysqladmin -uroot -S "$S" ping >/dev/null 2>&1 && break; sleep 1; done
fi
mysql -uroot -S "$S" -e "show databases like 'ilmpath'" | grep -q ilmpath || mysql -uroot -S "$S" < "$(dirname "$0")/schema.sql"
echo "MySQL ready on 127.0.0.1:3307 (db ilmpath, user ilmpath / change-this-password)"
