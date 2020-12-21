FROM node:15

## copy files/scripts
COPY entrypoint.sh /
COPY entrypoint.d /entrypoint.d/
COPY connector /connector/

ENV LANG en_US.utf8

ENV FSIP='127.0.0.1' \
    FSPORT='8021' \
    FSPW='ClueCon' \
    SWITCHCONF='/etc-freeswitch' \
    NODE_ENV='production' \
    FASTIPORT='3000' \
    FASTIIP='0.0.0.0' \
    HOSTNAME='localhost.localdomain'

ENV CRYPTDOM example.com

RUN chmod +x /entrypoint.sh

EXPOSE 443/tcp

WORKDIR /connector

ENTRYPOINT ["/entrypoint.sh"]

CMD ["connector"]
