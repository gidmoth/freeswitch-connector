/**
 * templates for conferences.
 * You must keep these in sync with the conference-
 * profiles specified in /etc/freeswitch/autoload-configs/conference.conf.xml
 * or connector will not work properly.
 */

const fastiConf = require('../config').getConfig('fasti');

const getConfFile = (conf) => {
  let xml = ''
  switch (conf.type) {
    case '16kHz-novideo':
      xml += `<include>
    <extension name="${conf.name}">
        <condition field="destination_number" expression="${conf.num}">
          <!-- force codec for all conferees -->
          <action application="set" data="codec_string=G722"/>
          <action application="answer"/>
          <action application="conference" data="${conf.name}@${conf.type}+\${conpin}+flags{\${conf_flags}}"/>
        </condition>
    </extension>
</include>
`
      break;
    case '48kHz-video':
      xml += `<include>
      <extension name="${conf.name}">
          <condition field="destination_number" expression="${conf.num}">
            <!-- force codec for all conferees -->
            <action application="set" data="codec_string=OPUS,H264"/>
            <action application="answer"/>
            <action application="conference" data="${conf.name}@${conf.type}+\${conpin}+flags{\${conf_flags}}"/>
          </condition>
      </extension>
</include>
`
      break;
    default:
      ;
  }
  return xml
}

getPolyDir = (confs) => {
  let dirxml = '<dirctory><item_list>'
  for (let conf of confs) {
    dirxml += `<item><fn>${conf.type}</fn><ln>${conf.name}</ln><ct>${conf.num}</ct></item>`
  }
  dirxml += "</item_list></directory>"
  return dirxml
}

exports.getConfFile = getConfFile;