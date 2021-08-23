# start building minimal fs archive
FROM debian:10 as fsbuilder

# freeswitch 1.10
COPY make_min_archive.sh /
RUN apt-get update && apt-get install -y --no-install-recommends \
    gnupg2 wget lsb-release ca-certificates locales curl git \
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
    freeswitch-mod-rtc \
    && chmod +x /make_min_archive.sh \
    && /make_min_archive.sh 

# run in new debian, alpine doesn't work unfortunately
FROM node:16

# connector, fsconcli
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && git clone https://github.com/gidmoth/connector.git \
    && git clone https://github.com/gidmoth/fsconcli.git \
    && cd connector && npm install \
    && cd /fsconcli && npm install && npm run build \
    && mkdir /recordings && cd / \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# static folders
COPY static /static/

#fsconcli
RUN cp -r /fsconcli/build/* /static/phone/ \
    && rm -rf /fsconcli

#freeswitch
COPY --from=fsbuilder /freeswitch_img.tar.gz /
RUN tar -xzf /freeswitch_img.tar.gz
RUN rm -rf /etc/freeswitch /freeswitch_img.tar.gz

# copy files/scripts
COPY entrypoint.sh /
COPY entrypoint.d /entrypoint.d/
COPY etc-freeswitch /etc/freeswitch/

# sounds for recording cotrol
COPY custom-sounds/48kHz/* /usr/share/freeswitch/sounds/en/us/callie/conference/48000/
COPY custom-sounds/16kHz/* /usr/share/freeswitch/sounds/en/us/callie/conference/16000/

## Environment
ENV LANG en_US.utf8
ENV PATH /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
# Env for freeswitch vars.xml and connector config.js
ENV DEFAULT_PASSWORD='napw' \
    SOUND_PREFIX='$${sounds_dir}/en/us/callie' \
    DOMAIN='host.example.com' \
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
    INTERNAL_TLS_ONLY='false' \
    ES_LISTEN_IP='127.0.0.1' \
    ES_LISTEN_PORT='8021' \
    ES_PW='ClueCon' \
    DEFCONPIN='0815' \
    MODCONPIN='2357' \
    # CAPEM_URL='https://letsencrypt.org/certs/trustid-x3-root.pem.txt' \
    RECORDINGSDIR='/recordings' \
    WSS_BINDING=':7443' \
    RTP_START_PORT='16384' \
    RTP_END_PORT='32768' \
    # for connector
    FSIP='127.0.0.1' \
    FSPORT='8021' \
    FSPW='ClueCon' \
    SWITCHCONF='/etc/freeswitch' \
    NODE_ENV='production' \
    FASTIPORT='443' \
    FASTIIP='0.0.0.0' \
    CONHOSTNAME='host.example.com' \
    STATICPATH='/static' \
    FASTICERT='/etc/freeswitch/tls/fullchain.pem' \
    FASTIKEY='/etc/freeswitch/tls/privkey.pem' \
    UCSOFTWARE='https://downloads.polycom.com/voice/voip/uc/Polycom-UC-Software-4.0.15-rts22-release-sig-split.zip' \
    RECPATH='/recordings' \
    CRYPTDOM='host.example.com'

# get the modes an permissions right
RUN chmod +x /entrypoint.sh

# Ports
# Open the container up to the world. Normaly you should run this
# with host networking, so it should not be needed. Only informational.
# tls sip
EXPOSE 3361/tcp
# wss sip (webrtc)
EXPOSE 7443/tcp
# webclient
EXPOSE 443/tcp
# rtc range
EXPOSE 16384-32768/udp

WORKDIR /connector

ENTRYPOINT ["/entrypoint.sh"]

CMD ["fscon"]
