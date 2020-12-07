/**
 * Generate sets to use for filenames/ids
 */

const UserCtxConf = require('../config.js').getConfig('contexts');
const Contexts = Object.keys(UserCtxConf);

function range(size, startAt) {
    return [...Array(size).keys()].map(i => i + startAt);
}

function genUsedSet(usrArray, context) {
    let used = new Set();
    usrArray.filter(usr => usr.context == context)
    .forEach(element => {
        used.add(element.id)
    });
    return used;
}

function genWholeset(context) {
    let whole = new Set()
    range(UserCtxConf[context].range, UserCtxConf[context].start)
    .forEach(element => {
        whole.add(element.toString())
    });
    return whole;
}

function genAvailSet(usrArray, context) {
    let avail = new Set(genWholeset(context))
    for (let elem of genUsedSet(usrArray, context)) {
        avail.delete(elem)
    }
    return avail;
}

const getAvaiUsers = (xmlState) => {
    let availUsrIds = {};
    Contexts.forEach(ctx => {
        availUsrIds[ctx] = genAvailSet(xmlState.users, ctx)
    });
    xmlState.availUsrIds = availUsrIds;
}

exports.getAvaiUsers = getAvaiUsers;