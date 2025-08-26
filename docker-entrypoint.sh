#!/bin/sh


set -e

DATA_DIR="/app/data"
CSV_FILE="$DATA_DIR/raffle_entries.csv"

if [ ! -d "$DATA_DIR" ]; then
    mkdir -p "$DATA_DIR"
    echo "Created data directory: $DATA_DIR"
fi

chown -R node:node "$DATA_DIR"

if [ ! -f "$CSV_FILE" ]; then
    echo "name,email,phone-number,timestamp,winner" > "$CSV_FILE"
    echo "Created CSV file: $CSV_FILE"
fi


if [ -z "$ADMIN_PASS" ]; then
    ADMIN_PASS=$(openssl rand -base64 8)
    echo "Generated admin password: $ADMIN_PASS"
fi

exec "$@"