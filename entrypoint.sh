#!/bin/bash
set -e

if [ "$1" = 'connector' ]; then

    if [ -d /entrypoint.d ]; then
        for f in /entrypoint.d/*.sh; do
            [ -f "$f" ] && . "$f"
        done
    fi
    
    exec node --trace-warnings connector.js
fi

exec "$@"
