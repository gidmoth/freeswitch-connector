/**
 * produces contents for filecreation
 */

const fastiConf = require('../config').getConfig('fasti');

const getUserFile = (user) => {
    let conferenceFlags = ''
    switch (user.context) {
        case fastiConf.apiallow:
            conferenceFlags = 'moderator|mute-detect';
            break;
        default:
            conferenceFlags = 'mute-detect';
    }
    return `<include>
    <user id="${user.id}">
      <params>
        <param name="password" value="${user.password}"/>
        <param name="vm-password" value="${user.id}"/>
      </params>
      <variables>
        <variable name="user_context" value="${user.context}"/>
        <variable name="effective_caller_id_name" value="${user.name}"/>
        <variable name="effective_caller_id_number" value="${user.id}"/>
        <variable name="outbound_caller_id_name" value="$\${outbound_caller_name}"/>
        <variable name="outbound_caller_id_number" value="$\${outbound_caller_id}"/>
        <variable name="verto_dvar_email" value="${user.email}"/>
        <variable name="polymac" value="${user.polymac}"/>
        <variable name="conf_flags" value="${conferenceFlags}"/>
        <variable name="conpin" value="${user.conpin}"/>
      </variables>
    </user>
</include>
`
}

const getLinXml = (user, hostname, tlsport) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <config xmlns="http://www.linphone.org/xsds/lpconfig.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.linphone.org/xsds/lpconfig.xsd lpconfig.xsd">
    <section name="proxy_0" overwrite="true">
      <entry name="reg_proxy" overwrite="true">&lt;sip:${hostname}:${tlsport};transport=tls&gt;</entry>
      <entry name="reg_identity" overwrite="true">"${user.name}" &lt;sip:${user.id}@${hostname}:${tlsport}&gt;</entry>
      <entry name="quality_reporting_enabled" overwrite="true">0</entry>
      <entry name="quality_reporting_interval" overwrite="true">0</entry>
      <entry name="reg_expires" overwrite="true">3600</entry>
      <entry name="reg_sendregister" overwrite="true">1</entry>
      <entry name="publish" overwrite="true">0</entry>
      <entry name="avpf" overwrite="true">0</entry>
      <entry name="avpf_rr_interval" overwrite="true">1</entry>
      <entry name="dial_escape_plus" overwrite="true">0</entry>
      <entry name="privacy" overwrite="true">32768</entry>
      <entry name="push_notification_allowed" overwrite="true">0</entry>
      <entry name="publish_expires" overwrite="true">-1</entry>
    </section>
    <section name="audio_codec_6" overwrite="true">
      <entry name="mime" overwrite="true">G722</entry>
      <entry name="rate" overwrite="true">8000</entry>
      <entry name="channels" overwrite="true">1</entry>
      <entry name="enabled" overwrite="true">16</entry>
    </section>
    <section name="sip">
      <entry name="media_encryption" overwrite="true">srtp</entry>
    </section>
    <section name="auth_info_0" overwrite="true">
      <entry name="username" overwrite="true">${user.id}</entry>
      <entry name="passwd" overwrite="true">${user.password}</entry>
      <entry name="realm"  overwrite="true">${hostname}</entry>
      <entry name="domain" overwrite="true">${hostname}</entry>
    </section>
    <section name="misc">
      <entry name="config-uri" overwrite="true">https://${user.name}:${user.password}@${hostname}/linphone</entry>
    </section>
  </config>
`
}

const getPolyMain = (user, hostname) => {
    return `<?xml version="1.0" standalone="yes"?>
<APPLICATION
   APP_FILE_PATH="https://${user.name}:${user.password}@${hostname}/polycom/sip.ld"
   CONFIG_FILES="https://${user.name}:${user.password}@${hostname}/polycom/allprov.cfg"
   MISC_FILES=""
   LOG_FILE_DIRECTORY=""
   OVERRIDES_DIRECTORY=""
   CONTACTS_DIRECTORY=""
   LICENSE_DIRECTORY=""
   USER_PROFILES_DIRECTORY=""
   CALL_LISTS_DIRECTORY=""
/>
`
}

const getPolyAll = (user, hostname, globals) => {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <PHONE_CONFIG>
    <ALL
      reg.1.address="${user.id}"
      reg.1.auth.domain="${hostname}"
      reg.1.auth.userId="${user.id}"
      reg.1.auth.password="${user.password}"
      reg.1.displayName="${user.name}"
      reg.1.server.1.address="${hostname}"
      reg.1.server.1.port="${globals.internal_tls_port}"
      reg.1.label="testhase"
      reg.1.type="private"
      reg.1.server.1.transport="TLS"
      tcpIpApp.sntp.address="europe.pool.ntp.org"
      tcpIpApp.sntp.address.overrideDHCP="1"
      voIpProt.SIP.specialEvent.checkSync.alwaysReboot="1"
      voIpProt.SIP.serverFeatureControl.cf="0"
      voIpProt.SIP.serverFeatureControl.dnd="0"
      voIpProt.server.1.address="${hostname}"
      voIpProt.server.1.transport="TLS"
      feature.presence.enabled="1"
      feature.urlDialing.enabled="0"
      pres.idleSoftkeys="0"
      sec.srtp.offer="1"
      sec.srtp.offer.HMAC_SHA1_32="1"
      sec.srtp.offer.HMAC_SHA1_80="0"
      sec.srtp.resumeWithNewKey="0"
      device.set="1"
      voice.codecPref.G729_AB="0"
      voice.codecPref.G711_A="0"
      device.prov.redunAttemptLimit.set="1"
      device.prov.redunAttemptLimit="1"
      device.prov.serverName.set="1"
      device.prov.serverName="https://${user.name}:${user.password}@${hostname}/polycom"
      device.prov.serverType.set="1"
      device.prov.serverType="HTTPS"
      device.prov.ztpEnabled.set="1"
      device.prov.ztpEnabled="0"
    />
  </PHONE_CONFIG>
`
}

exports.getUserFile = getUserFile;
exports.getPolyMain = getPolyMain;
exports.getPolyAll = getPolyAll;
exports.getLinXml = getLinXml;