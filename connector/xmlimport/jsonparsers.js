/**
 * parsers for jsonified xml
 */

const ConfCtxConf = require('../config.js').getConfig('contexts');
const Contexts = Object.keys(ConfCtxConf);

function genArrayFilter(arr, aname) {
    return arr.filter(item => item.attrib_name == aname)[0].attrib_value;
}

function parseUser(usr) {
    let puser = {
        id: usr.attrib_id,
        password: genArrayFilter(usr.params.param, "password"),
        conpin: genArrayFilter(usr.variables.variable, "conpin"),
        context: genArrayFilter(usr.variables.variable, "user_context"),
        name: genArrayFilter(usr.variables.variable, "effective_caller_id_name"),
        email: genArrayFilter(usr.variables.variable, "verto_dvar_email"),
        polymac: genArrayFilter(usr.variables.variable, "polymac")
    }
    return puser;
}

function getConfArray(dialplan) {
    let confArray = [];
    dialplan.section.context.forEach(ctx => {
        ctx.extension.forEach(ext => {
            if (Array.isArray(ext.condition.action)) {
                if (ext.condition.action.filter(e => {
                    return e.attrib_application == 'conference'
                }).length == 1) {
                    confArray.push(ext);
                }
            }
        })
    })
    return confArray;
}

function confCtxDetect(numb) {
    let retval = '';
    Contexts.forEach(ctx => {
        if (+numb >= ConfCtxConf[ctx].confStart && +numb < ConfCtxConf[ctx].confStart + ConfCtxConf[ctx].confRange) {
            retval = ctx;
        }
    });
    return retval;
}

function parseConference(conf) {
    let pconf = {
        num: conf.condition.attrib_expression,
        name: conf.attrib_name
    }
    let actObj = conf.condition.action.filter(act => {
        return act.attrib_application == 'conference'
    })[0];
    pconf.type = actObj.attrib_data.split('@')[1].split('+')[0];
    pconf.context = confCtxDetect(pconf.num);

    return pconf;
}

const parseDirectory = (dir) => {
    let pusers = [];
    dir.section.domain.groups.group.forEach(gr => {
        switch (typeof (gr.users)) {
            case 'string':
                break;
            case 'object':
                if (Array.isArray(gr.users.user)) {
                    gr.users.user.forEach(u => {
                        pusers.push(parseUser(u));
                    })
                } else {
                    pusers.push(parseUser(gr.users.user))
                }
                break;
            default:
                ;
        }

    })
    return pusers;
}

const parseConferences = (dialplan) => {
    let conferences = [];
    getConfArray(dialplan).forEach(conf => {
        conferences.push(parseConference(conf));
    })
    return conferences;
}

const parseConfTypes = (confconf) => {
    let types = [];
    switch (typeof (confconf.configuration.profiles)) {
        case 'string':
            break;
        case 'object':
            if (Array.isArray(confconf.configuration.profiles.profile)) {
                confconf.configuration.profiles.profile.forEach(prof => {
                    types.push(prof.attrib_name);
                })
            } else {
                types.push(confconf.configuration.profiles.profile.attrib_name)
            }
            break;
        default:
            ;
    }
    return types;
}

exports.parseDirectory = parseDirectory;
exports.parseConferences = parseConferences;
exports.parseConfTypes = parseConfTypes;
