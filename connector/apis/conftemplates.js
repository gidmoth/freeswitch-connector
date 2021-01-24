/**
 * templates for conferences.
 * You must keep these in sync with the conference-
 * profiles specified in /etc/freeswitch/autoload-configs/conference.conf.xml
 * or connector will not work properly.
 */

const fastiConf = require('../config').getConfig('fasti');
const fs = require('fs')
const path = require('path')
const sax = require('sax')
const Provpaths = require('../config').getConfig('provisioningpaths')

const strict = true
const opts = { trim: true }

const filterCustItems = (user) => {
  if (fs.existsSync(path.join(Provpaths.polycom, `${user.polymac}/${user.polymac}-directory.xml`))) {
    let collector = ''
    let item = 0
    let saxStream = sax.createStream(strict, opts)
    saxStream.on('error', function (e) {
      console.log(e)
    })
    saxStream.on('opentag', function (tag) {
      if (tag.name == 'item') {
        if (!tag.attributes.hasOwnProperty('server')) {
          item = 1
          collector += `<${tag.name}>
          `}
      } else {
        if (item == 1) {
          collector += `<${tag.name}>`
        }
      }
    })
    saxStream.on('text', function (txt) {
      if (item == 1) {
        collector += `${txt}`
      }
    })
    saxStream.on('closetag', function (tag) {
      if (tag == 'item' && item == 1) {
        item = 0
        collector += `</${tag}>
                `
      } else {
        if (item == 1) {
          collector += `</${tag}>
          `}
      }
    })
    saxStream.on('end', function () {
      return collector
    })
    fs.createReadStream(path.join(Provpaths.polycom, `${user.polymac}/${user.polymac}-directory.xml`))
      .pipe(saxStream)
  } else {
    return ''
  }
}

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

getPolyDir = (confs, user) => {
  let dirxml = `<directory>
    <item_list>
`
  dirxml += filterCustItems(user)
  for (let conf of confs) {
    dirxml += `        <item server='yes'>
            <fn>${conf.name}</fn>
            <ln>${conf.type}</ln>
            <ct>${conf.num}</ct>
        </item>
`
  }
  dirxml += `    </item_list>
</directory>
`
  return dirxml
}

exports.getConfFile = getConfFile;
exports.getPolyDir = getPolyDir;
