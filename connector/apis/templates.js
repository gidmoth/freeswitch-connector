/**
 * produces contents for filecreation
 */

const fastiConf = require('../config').getConfig('fasti');

const getUserFile = (user) => {
    let conferenceFlags = ''
    switch (user.context) {
        case fastiConf.apiallow:
            conferenceFlags = 'moderator|mute';
            break;
        default:
            conferenceFlags = 'mute';
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
</include>`
}

exports.getUserFile = getUserFile;