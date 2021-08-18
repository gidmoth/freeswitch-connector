#!/bin/bash

if [ ! -f $STATICPATH/polycom/ucs/sip.ver ]
then
  cd $STATICPATH/polycom/ucs
  curl -O $UCSOFTWARE
  FILE=${UCSOFTWARE##*/}
  unzip $FILE
  echo "UCS DOWNLOADED"
  cd /connector
else
  echo "UCS FOUND"
fi
