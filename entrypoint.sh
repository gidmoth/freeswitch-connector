#!/bin/bash
set -e

/connector/node_modules/.bin/secure-session-gen-key > /static/secrets/secret-key

if [ "$1" = 'connector' ]; then

    if [ -d /entrypoint.d ]; then
        for f in /entrypoint.d/*.sh; do
            [ -f "$f" ] && . "$f"
        done
    fi
    
    exec node connector.js
fi

exec "$@"
