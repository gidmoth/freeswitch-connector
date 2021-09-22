#!/bin/bash
inotifywait --format %f -me create $RECPATH/ | \
while read FILE
  do
    if [ ${FILE##*.} = "wav" ]
      then
        echo "recording started for $FILE"
        sleep 10
        /usr/local/bin/audiobot.sh $RECPATH $FILE &
      else
        echo "ignoring $FILE"
    fi
  done

