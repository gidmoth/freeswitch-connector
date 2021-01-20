FROM node:15

## copy files/scripts
COPY entrypoint.sh /
COPY entrypoint.d /entrypoint.d/
COPY connector /connector/
COPY static /static/
COPY depinstall.sh /

ENV LANG en_US.utf8

ENV FSIP='127.0.0.1' \
    FSPORT='8021' \
    FSPW='ClueCon' \
    SWITCHCONF='/etc-freeswitch' \
    NODE_ENV='production' \
    FASTIPORT='3000' \
    FASTIIP='0.0.0.0' \
    CONHOSTNAME='localhost.localdomain' \
    STATICPATH='/static' \
    FASTICERT='/etc-freeswitch/tls/fullchain.pem' \
    FASTIKEY='/etc-freeswitch/tls/privkey.pem' \
    UCSOFTWARE='https://downloads.polycom.com/voice/voip/uc/Polycom-UC-Software-4.0.15-rts22-release-sig-split.zip' \
    RECPATH='/recordings'

ENV CRYPTDOM example.com

RUN chmod +x /entrypoint.sh && \
    chmod +x /depinstall.sh && \
    /depinstall.sh

EXPOSE 443/tcp

WORKDIR /connector

ENTRYPOINT ["/entrypoint.sh"]

CMD ["connector"]
