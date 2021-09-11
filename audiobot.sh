#!/bin/bash
inotifywait -e close_write /recordings/$1 | \
  while read STOP
    do
      sleep 10
      normalize-audio --amplitude=-8dBFS /recordings/$1
      export mname=$(echo $1|sed 's/.wav$/.mp3/')
      ffmpeg -i  /recordings/$1 -y -af dynaudnorm -ab 64k /var/www/shares/audiored/raw/$mname
      rm /recordings/$1
    done
