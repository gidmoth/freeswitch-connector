#!/bin/bash
inotifywait --format %f -me create /recordings/ | \
while read FILE
  do
    echo "recording started for $FILE"
    export FILE
    sleep 10
    /opt/bin/audiobot.sh $FILE &
  done

