#!/bin/bash

if [ ! -f /etc/freeswitch/localvars ]
then
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
  touch /etc/freeswitch/localvars
  chown freeswitch /etc/freeswitch/vars.xml
  echo "VARS LOCALIZED"
else
  echo "VARS NOT TOUCHED"
fi
