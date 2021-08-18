#!/bin/bash
set -e

if [ "$1" = 'fscon' ]; then

    chown -R freeswitch:freeswitch /etc/freeswitch
    chown -R freeswitch:freeswitch /var/{run,lib}/freeswitch
    
    if [ -d /entrypoint.d ]; then
        for f in /entrypoint.d/*.sh; do
            [ -f "$f" ] && . "$f"
        done
    fi
    
    /usr/bin/freeswitch -nonat -c &
    sleep 30
    exec node connector.js
fi

exec "$@"