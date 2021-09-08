#!/bin/bash

# Environment, please edit and set LOCALIZED to 'true'.
# This script will not run if that is not the case.

# Set to 'true' if done localizing the following block
LOCALIZED='false'

# Localize to suite your environment
DEFAULT_PASSWORD='napw'
SOUND_PREFIX='$${sounds_dir}/en/us/callie'
DOMAIN='host.example.com'
DOMAIN_NAME='$${domain}'
GLOBAL_CODEC_PREFS='OPUS,G722,H264,VP8'
OUTBOUND_CODEC_PREFS='OPUS,G722,H264,VP8'
EXTERNAL_RTP_IP='$${local_ip_v4}'
EXTERNAL_SIP_IP='$${local_ip_v4}'
XML_RPC_PASSWORD='napw'
INTERNAL_SIP_PORT='5060'
EXTERNAL_SIP_PORT='5080'
SIP_TLS_VERSION='tlsv1,tlsv1.1,tlsv1.2'
INTERNAL_TLS_PORT='3361'
INTERNAL_SSL_ENABLE='true'
EXTERNAL_TLS_PORT='3381'
EXTERNAL_SSL_ENABLE='false'
SIP_TLS_CIPHERS='ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH'
INTERNAL_TLS_ONLY='false'
ES_LISTEN_IP='127.0.0.1'
ES_LISTEN_PORT='8021'
ES_PW='ClueCon'
DEFCONPIN='0815'
MODCONPIN='2357'
RECORDINGSDIR='/recordings'
WSS_BINDING=':7443'
RTP_START_PORT='16384'
RTP_END_PORT='32768'
# For connector
FSIP='127.0.0.1'
FSPORT='8021'
FSPW='ClueCon'
SWITCHCONF='/etc/freeswitch'
NODE_ENV='production'
FASTIPORT='443'
FASTIIP='0.0.0.0'
CONHOSTNAME='host.example.com'
STATICPATH='/static'
FASTICERT='/etc/freeswitch/tls/fullchain.pem'
FASTIKEY='/etc/freeswitch/tls/privkey.pem'
UCSOFTWARE='https://downloads.polycom.com/voice/voip/uc/Polycom-UC-Software-4.0.15-rts22-release-sig-split.zip'
RECPATH='/recordings'
# For TLS
CRYPTDOM='host.example.com'

# Print help if not localized
if [ $LOCALIZED != 'true' ]
then
    echo 'Please edit the Environment before you run me.'
    echo "Then set \$LOCALIZED to 'true' (the string, not the boolean)."
    exit
fi

# check for root
if [ "$EUID" -ne 0 ]
then
    echo "Please run me as root."
    exit
fi

# install freeswitch and some convenience tools
apt-get update && apt-get install -y --no-install-recommends \
    gnupg2 wget lsb-release ca-certificates locales curl unzip \
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
    freeswitch-mod-rtc

# stop freeswitch service
systemctl stop freeswitch.service

## create customization to run in foreground
#mkdir /etc/systemd/system/freeswitch.service.d
#cat << EOF > /etc/systemd/system/freeswitch.service.d/10-foreground.conf
#[Service]
#ExecStart=
#ExecStart=/usr/bin/freeswitch -u \${USER} -g \${GROUP} \${DAEMON_OPTS}
#EOF

# Install nodejs
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt-get install -y nodejs

# install connector
cd / && git clone -b gsc https://github.com/gidmoth/connector.git
cd /connector && npm install

# download and build fsconcli
cd ~ && git clone -b gsc https://github.com/gidmoth/fsconcli.git
cd ~/fsconcli && npm install && npm run build

# remove freeswitchs defaults and use provided
cd ~
rm -rf /etc/freeswitch/*
cp -r ~/freeswitch-connector/etc-freeswitch/* /etc/freeswitch/

# copy custom sounds
cp ~/freeswitch-connector/custom-sounds/48kHz/* /usr/share/freeswitch/sounds/en/us/callie/conference/48000/
cp ~/freeswitch-connector/custom-sounds/16kHz/* /usr/share/freeswitch/sounds/en/us/callie/conference/16000/

# generate vars.xml according to env:
cat << EOF > /etc/freeswitch/vars.xml
<include>

  <!--
      The following variables are set dynamically:

      hostname
      local_ip_v4
      local_mask_v4
      local_ip_v6
      switch_serial
      base_dir
      recordings_dir
      sound_prefix
      sounds_dir
      conf_dir
      log_dir
      run_dir
      db_dir
      mod_dir
      htdocs_dir
      script_dir
      temp_dir
      grammar_dir
      certs_dir
      storage_dir
      cache_dir
      core_uuid
      zrtp_enabled
      nat_public_addr
      nat_private_addr
      nat_type
  -->

  <!-- NOTE: CHANGE THIS BEFORE USE -->
  <X-PRE-PROCESS cmd="set" data="default_password=$DEFAULT_PASSWORD"/>

  <!-- Soundsdefault -->
  <X-PRE-PROCESS cmd="set" data="sound_prefix=$SOUND_PREFIX"/>

  <!-- Fallbackdomainsetting -->
  <X-PRE-PROCESS cmd="set" data="domain=$DOMAIN"/>
  <X-PRE-PROCESS cmd="set" data="domain_name=$DOMAIN_NAME"/>

  <!-- Codecprefs -->
  <X-PRE-PROCESS cmd="set" data="global_codec_prefs=$GLOBAL_CODEC_PREFS"/>
  <X-PRE-PROCESS cmd="set" data="outbound_codec_prefs=$OUTBOUND_CODEC_PREFS"/>

  <!-- external_rtp_ip -->
  <X-PRE-PROCESS cmd="set" data="external_rtp_ip=$EXTERNAL_RTP_IP"/>

  <!-- external_sip_ip -->
  <X-PRE-PROCESS cmd="set" data="external_sip_ip=$EXTERNAL_SIP_IP"/>

  <!-- NOTE: CHANGE THIS BEFORE USE -->
  <X-PRE-PROCESS cmd="set" data="xml_rpc_password=$XML_RPC_PASSWORD"/>

  <X-PRE-PROCESS cmd="set" data="internal_sip_port=$INTERNAL_SIP_PORT"/>
  <X-PRE-PROCESS cmd="set" data="external_sip_port=$EXTERNAL_SIP_PORT"/>

  <!-- tls things, see profiles for reflexion -->
  <X-PRE-PROCESS cmd="set" data="sip_tls_version=$SIP_TLS_VERSION"/>
  <X-PRE-PROCESS cmd="set" data="internal_tls_port=$INTERNAL_TLS_PORT"/>
  <X-PRE-PROCESS cmd="set" data="internal_ssl_enable=$INTERNAL_SSL_ENABLE"/>
  <X-PRE-PROCESS cmd="set" data="external_tls_port=$EXTERNAL_TLS_PORT"/>
  <X-PRE-PROCESS cmd="set" data="external_ssl_enable=$EXTERNAL_SSL_ENABLE"/>
  <X-PRE-PROCESS cmd="set" data="sip_tls_ciphers=$SIP_TLS_CIPHERS"/>
  <X-PRE-PROCESS cmd="set" data="internal_tls_only=$INTERNAL_TLS_ONLY"/>

  <!--verto defaults -->
  <X-PRE-PROCESS cmd="set" data="verto_bindlocal_port=$VERTO_BINDLOCAL_PORT"/>

  <!-- esl defaults -->
  <X-PRE-PROCESS cmd="set" data="es_listen_ip=$ES_LISTEN_IP"/>
  <X-PRE-PROCESS cmd="set" data="es_listen_port=$ES_LISTEN_PORT"/>
  <X-PRE-PROCESS cmd="set" data="es_pw=$ES_PW"/>

  <!-- conference pins -->
  <X-PRE-PROCESS cmd="set" data="defconpin=$DEFCONPIN"/>
  <X-PRE-PROCESS cmd="set" data="modconpin=$MODCONPIN"/>

  <!-- recordings directory -->
  <X-PRE-PROCESS cmd="set" data="recordings_dir=$RECORDINGSDIR"/>

  <!-- wss binding for sofia -->
  <X-PRE-PROCESS cmd="set" data="wss_binding=$WSS_BINDING"/>

  <!-- rtp port rnage -->
  <X-PRE-PROCESS cmd="set" data="rtp_start_port=$RTP_START_PORT"/>
  <X-PRE-PROCESS cmd="set" data="rtp_end_port=$RTP_END_PORT"/>

</include>
EOF

# copy static folders
cp -r ~/freeswitch-connector/static/* ${STATICPATH}

# copy custom sounds
cp ~/freeswitch-connector/custom-sounds/48kHz/* /usr/share/freeswitch/sounds/en/us/callie/conference/48000/
cp ~/freeswitch-connector/custom-sounds/16kHz/* /usr/share/freeswitch/sounds/en/us/callie/conference/16000/

# generate secret, download ucs and create recordingsdir
/connector/node_modules/.bin/secure-session-gen-key > ${STATICPATH}/secrets/secret-key
cd /static/polycom/ucs && \
curl -O $UCSOFTWARE && \
unzip ./*.zip && \
cd ~ && mkdir -p $RECPATH

# copy client
cp -r  ~/fsconcli/build/* /static/phone

# chown all to freeswitch
chown -R freeswitch:freeswitch $STATICPATH /connector $RECPATH

# generate connector service
cat << EOF > /etc/systemd/system/connector.service
[Unit]
Description=freeswitch-connector middleware
After=network.target freeswitch.service

[Service]
AmbientCapabilities=CAP_NET_BIND_SERVICE
Environment=FSIP=$FSIP
Environment=FSPORT=$FSPORT
Environment=FSPW=$FSPW
Environment=SWITCHCONF=$SWITCHCONF
Environment=NODE_ENV=$NODE_ENV
Environment=FASTIPORT=$FASTIPORT
Environment=FASTIIP=$FASTIIP
Environment=CONHOSTNAME=$CONHOSTNAME
Environment=STATICPATH=$STATICPATH
Environment=FASTICERT=$FASTICERT
Environment=FASTIKEY=$FASTIKEY
Environment=UCSOFTWARE=$UCSOFTWARE
Environment=RECPATH=$RECPATH
User=freeswitch
Group=freeswitch
ExecStartPre=/usr/bin/sleep 30
ExecStart=/usr/bin/node /connector/connector.js

[Install]
WantedBy=multi-user.target
EOF

# enable service
systemctl enable connector.service
