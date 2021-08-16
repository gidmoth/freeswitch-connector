FROM debian:10

## Installation
# Some convenience-tools and freeswitch 1.10
RUN apt-get update && apt-get install -y --no-install-recommends \
    gnupg2 wget lsb-release ca-certificates gosu locales \
    && wget -O - https://files.freeswitch.org/repo/deb/debian-release/fsstretch-archive-keyring.asc | apt-key add - \
    && echo "deb http://files.freeswitch.org/repo/deb/debian-release/ `lsb_release -sc` main" > /etc/apt/sources.list.d/freeswitch.list \
    && echo "deb-src http://files.freeswitch.org/repo/deb/debian-release/ `lsb_release -sc` main" >> /etc/apt/sources.list.d/freeswitch.list \
    && apt-get update && apt-get install -y --no-install-recommends \
    freeswitch \
    freeswitch-mod-commands \
    freeswitch-mod-conference \
    freeswitch-mod-dptools \
    freeswitch-mod-voicemail \
    freeswitch-mod-dialplan-xml \
    freeswitch-mod-loopback \
    freeswitch-mod-sofia \
    freeswitch-mod-local-stream \
    freeswitch-mod-native-file \
    freeswitch-mod-sndfile \
    freeswitch-mod-tone-stream \
    freeswitch-mod-console \
    freeswitch-mod-say-en \
    freeswitch-init \
    freeswitch-lang-en \
    freeswitch-timezones \
    freeswitch-meta-codecs \
    freeswitch-music \
    freeswitch-sounds-en-us-callie \
    freeswitch-mod-event-socket \
    freeswitch-mod-xml-rpc \
    freeswitch-mod-verto \
    freeswitch-mod-rtc \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8 \
    && rm -rf /etc/freeswitch \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

## copy files/scripts
COPY entrypoint.sh /
COPY entrypoint.d /entrypoint.d/
# set ulimits
# COPY build/freeswitch.limits.conf /etc/security/limits.d/
# This may work, if not, try to run with podman as a systemd.service
# and the option:
# `podman run --ulimit=host`
# copy custom config:
COPY etc-freeswitch /etc/freeswitch/

COPY custom-sounds/48kHz/* /usr/share/freeswitch/sounds/en/us/callie/conference/48000/
COPY custom-sounds/16kHz/* /usr/share/freeswitch/sounds/en/us/callie/conference/16000/

## Environment
ENV LANG en_US.utf8
ENV PATH /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
# Env for freeswitch vars.xml
ENV DEFAULT_PASSWORD='napw' \
    SOUND_PREFIX='$${sounds_dir}/en/us/callie' \
    DOMAIN='$${local_ip_v4}' \
    DOMAIN_NAME='$${domain}' \
    GLOBAL_CODEC_PREFS='OPUS,G722,H264,VP8' \
    OUTBOUND_CODEC_PREFS='OPUS,G722,H264,VP8' \
    EXTERNAL_RTP_IP='$${local_ip_v4}' \
    EXTERNAL_SIP_IP='$${local_ip_v4}' \
    XML_RPC_PASSWORD='napw' \
    INTERNAL_SIP_PORT='5060' \
    EXTERNAL_SIP_PORT='5080' \
    SIP_TLS_VERSION='tlsv1,tlsv1.1,tlsv1.2' \
    INTERNAL_TLS_PORT='3361' \
    INTERNAL_SSL_ENABLE='true' \
    EXTERNAL_TLS_PORT='3381' \
    EXTERNAL_SSL_ENABLE='false' \
    SIP_TLS_CIPHERS='ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH' \
    VERTO_BINDLOCAL_PORT='8082' \
    INTERNAL_TLS_ONLY='false' \
    ES_LISTEN_IP='127.0.0.1' \
    ES_LISTEN_PORT='8021' \
    ES_PW='ClueCon' \
    DEFCONPIN='0815' \
    MODCONPIN='2357' \
    CAPEM_URL='https://letsencrypt.org/certs/trustid-x3-root.pem.txt' \
    RECORDINGSDIR='/recordings' \
    WSS_BINDING=':7443'

# Cryptdom means "Cryptodomain" -- may be different from domain, since
# you may have wildcard-certs. See entrypoint.d/letsencrypt-cert-load.sh
# for a usage example.
ENV CRYPTDOM example.com

## get the modes an permissions right
RUN chmod +x /entrypoint.sh && chmod +x /entrypoint.d/genericcerts.bash

## Ports
# Open the container up to the world.
# 8021 fs_cli, 5060 5061 5080 5081 sip and sips, 64535-65535 rtp
EXPOSE 8021/tcp
EXPOSE 5060/tcp 5060/udp 5080/tcp 5080/udp
EXPOSE 5061/tcp 5061/udp 5081/tcp 5081/udp
EXPOSE 7443/tcp
EXPOSE 5070/udp 5070/tcp
EXPOSE 64535-65535/udp
EXPOSE 16384-32768/udp

## Healthcheck to make sure the service is running
# not sure if this is working flawless with podman or cri-o
# SHELL is not supported for OCI format
#SHELL       ["/bin/bash"]
#HEALTHCHECK --interval=15s --timeout=5s \
#    CMD  /usr/bin/fs_cli -x status | grep -q ^UP || exit 1


ENTRYPOINT ["/entrypoint.sh"]

CMD ["freeswitch"]





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
