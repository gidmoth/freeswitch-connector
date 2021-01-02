/**
 * Functions to interface with the freeswitch xml files
 */

const fs = require('fs');
const path = require('path');
const Contexts = require('../config').getConfig('contexts');
const Confpath = require('../config').getConfig('confdir');
const Provpaths = require('../config').getConfig('provisioningpaths');
const emailRegex = require('email-regex');
const passgen = require('generate-password');
const fastiConf = require('../config').getConfig('fasti');
const templates = require('./templates');
const reloadxml = require('../fseventusers/reloadxml');

// utilities
const getNext = (xmlState, thing, ctx) => {
    let next = ''
    if (thing == 'user') {
        next = `${[...xmlState.availUsrIds[ctx]][0]}`
        xmlState.availUsrIds[ctx].delete(next)
    }
    if (thing == 'conf') {
        next = `${[...xmlState.availConfNums[ctx]][0]}`
        xmlState.availConfNums[ctx].delete(next);
    }
    return next;
}

const genPass = () => {
    return passgen.generate({
        length: 10,
        numbers: true
    })
}

const polyProvUser = (user, xmlState) => {
    let masterfileXml = templates.getPolyMain(user, fastiConf.hostname)
    let masterfileFile = path.join(Provpaths.polycom, `${user.polymac}/${user.polymac}.cfg`)
    let allprovXml = templates.getPolyAll(user, fastiConf.hostname, xmlState.globals)
    let allprovFile = path.join(Provpaths.polycom, `${user.polymac}/allprov.cfg`)
    if (!(fs.existsSync(path.dirname(allprovFile)))) {
        fs.mkdirSync(path.dirname(allprovFile))
    }
    fs.writeFileSync(masterfileFile, masterfileXml)
    fs.writeFileSync(allprovFile, allprovXml)
}

const linProvUser = (user, xmlState) => {
    let linphoneXml = templates.getLinXml(user, xmlState.globals.hostname, xmlState.globals.internal_tls_port)
    let linphoneFile = path.join(Provpaths.linphone, `${user.id}/linphone.xml`)
    if (!(fs.existsSync(path.dirname(linphoneFile)))) {
        fs.mkdirSync(path.dirname(linphoneFile))
    }
    fs.writeFileSync(linphoneFile, linphoneXml)
}

const buildNewUser = (xmlState, user, newusers) => {
    let newuser = {}
    if (xmlState.users.map(usr => usr.name).includes(user.name)) {
        newusers.failed.push({
            'error': 'name already taken',
            'user': user
        })
        return;
    }
    if (!(emailRegex().test(user.email))) {
        newusers.failed.push({
            'error': 'email does not contain an email',
            'user': user
        })
        return;
    }
    if (!(Contexts.hasOwnProperty(user.context))) {
        newusers.failed.push({
            'error': 'context does not exist',
            'user': user
        })
        return;
    }
    newuser.id = getNext(xmlState, 'user', user.context);
    if (user.hasOwnProperty('password') && user.password !== '') {
        newuser.password = user.password;
    } else {
        newuser.password = genPass();
    }
    if (user.hasOwnProperty('conpin') && user.conpin !== '') {
        newuser.conpin = user.conpin;
    } else {
        switch (user.context) {
            case fastiConf.apiallow:
                newuser.conpin = '$${modconpin}';
                break;
            default:
                newuser.conpin = '$${defconpin}';
        }
    }
    newuser.context = user.context;
    newuser.name = user.name;
    newuser.email = user.email;
    if (user.hasOwnProperty('polymac') && user.polymac !== '') {
        newuser.polymac = user.polymac;
    } else {
        newuser.polymac = 'none';
    }
    let newuserXml = templates.getUserFile(newuser);
    let newuserFile = path.join(Contexts[newuser.context].path, `${newuser.id}.xml`);
    fs.writeFileSync(newuserFile, newuserXml);
    if (newuser.polymac !== 'none') {
        polyProvUser(newuser, xmlState)
    }
    linProvUser(newuser, xmlState);
    newusers.done.push(newuser);
    xmlState.users.push(newuser);
    return;
}

// functions
const newUsers = (xmlState, users) => new Promise ((resolve, reject) => {
    if (users == []) {
        reject('no users given');
    }
    let newusers = {done:[], failed:[]};
    users.forEach(usr => {
        buildNewUser(xmlState, usr, newusers);
    })
    reloadxml.run(xmlState)
    .then(msg => {
        console.log(`reloadxml after newUsers: ${msg.trim()}`)
    });
    resolve(newusers);
});

exports.newUsers = newUsers;