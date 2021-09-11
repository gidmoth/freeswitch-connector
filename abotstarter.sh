#!/bin/bash
inotifywait --format %f -me create $RECPATH/ | \
while read FILE
  do
    echo "recording started for $FILE"
    export FILE
    sleep 10
    /usr/local/bin/audiobot.sh $RECPATH $FILE &
  done

