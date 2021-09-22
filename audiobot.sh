#!/bin/bash
inotifywait -e close_write $1/$2 | \
  while read STOP
    do
      sleep 10
      normalize-audio --amplitude=-8dBFS $1/$2
      mname=$(echo $2|sed 's/.wav$/.mp3/')
      ffmpeg -i  $1/$2 -y -af dynaudnorm -ab 64k $1/$mname
      cp $1/$2 /backuprec/$2
      rm $1/$2
      find $1/* -mtime 7 -delete
      find /backuprec/* -mtime 7 -delete
    done
