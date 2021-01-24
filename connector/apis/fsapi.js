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
const conftpl = require('./conftemplates');
const reloadxml = require('../fseventusers/reloadxml');
const myCtx = Object.keys(Contexts);

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

const getConfArrays = (xmlState) => {
    let { apiallow, allow, disallow } = fastiConf
    let colls = {}
    colls[apiallow] = []
    colls[allow] = []
    colls[disallow] = []
    for (let conf of xmlState.conferences.filter(c => c.context == fastiConf.disallow)) {
        colls[fastiConf.apiallow].push(conf)
        colls[fastiConf.allow].push(conf)
        colls[fastiConf.disallow].push(conf)
    }
    for (let conf of xmlState.conferences.filter(c => c.context == fastiConf.allow)) {
        colls[fastiConf.apiallow].push(conf)
        colls[fastiConf.allow].push(conf)
    }
    for (let conf of xmlState.conferences.filter(c => c.context == fastiConf.apiallow)) {
        colls[fastiConf.apiallow].push(conf)
    }
    return colls
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
    let confcols = getConfArrays(xmlState)
    let dirxml = conftpl.getPolyDir(confcols[user.context], user)
    let dirpath = path.join(Provpaths.polycom, `${user.polymac}/${user.polymac}-directory.xml`)
    fs.writeFileSync(dirpath, dirxml);
}

const linProvUser = (user, xmlState) => {
    let confObj = getConfArrays(xmlState)
    let linphoneXml = templates.getLinXml(user, xmlState.globals.hostname, xmlState.globals.internal_tls_port, confObj)
    let linphoneFile = path.join(Provpaths.linphone, `${user.id}/linphone.xml`)
    if (!(fs.existsSync(path.dirname(linphoneFile)))) {
        fs.mkdirSync(path.dirname(linphoneFile))
    }
    fs.writeFileSync(linphoneFile, linphoneXml)
}

const reprovUser = (usr, reproved, xmlState) => {
    linProvUser(usr, xmlState)
    if (usr.polymac !== 'none') {
        polyProvUser(usr, xmlState)
    }
    reproved.done.push(usr)
    return;
}

const rebuildUser = (usr, rebuilt) => {
    let userXml = templates.getUserFile(usr);
    let userFile = path.join(Contexts[usr.context].path, `${usr.id}.xml`);
    fs.writeFileSync(userFile, userXml);
    rebuilt.done.push(usr)
    return;
}

const delUser = (xmlState, userid, delusers) => {
    let user = xmlState.users.filter(usr => usr.id == userid)
    if (user == []) {
        delusers.failed.push({
            'error': `no userid ${userid}`
        })
        return;
    }
    let wholeuser = user[0]
    let userDirFile = path.join(Contexts[wholeuser.context].path, `${wholeuser.id}.xml`);
    let userLinDir = path.join(Provpaths.linphone, `${wholeuser.id}`)
    fs.rmdirSync(userLinDir, { recursive: true })
    fs.unlinkSync(userDirFile)
    if (wholeuser.polymac !== 'none') {
        let userPolyDir = path.join(Provpaths.polycom, `${wholeuser.polymac}`)
        fs.rmdirSync(userPolyDir, { recursive: true })
    }
    delusers.done.push(wholeuser)
    return;
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
    newuser.name = user.name.trim();
    newuser.email = user.email.trim();
    if (user.hasOwnProperty('polymac') && user.polymac !== '') {
        newuser.polymac = user.polymac.trim();
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

const modUser = (xmlState, user, modiusers) => {
    let myuser = xmlState.users.filter(usr => usr.id == user.id)
    if (myuser == []) {
        modiusers.failed.push({
            'error': `no userid ${userid}`,
            'user': user
        })
        return;
    }
    let mywholeuser = myuser[0]
    let newuser = {}
    if (user.hasOwnProperty('context')) {
        if (!(Contexts.hasOwnProperty(user.context))) {
            modiusers.failed.push({
                'error': 'context does not exist',
                'user': user
            })
            return;
        }
        if (user.context == mywholeuser.context) {
            newuser.id = user.id
            newuser.context = user.context;
        } else {
            newuser.id = getNext(xmlState, 'user', user.context);
            newuser.context = user.context;
        }
    } else {
        newuser.id = user.id
        newuser.context = mywholeuser.context
    }
    if (user.hasOwnProperty('email')) {
        if (!(emailRegex().test(user.email))) {
            modiusers.failed.push({
                'error': 'email does not contain an email',
                'user': user
            })
            return;
        } else {
            newuser.email = user.email
        }
    } else {
        newuser.email = mywholeuser.email
    }
    if (user.hasOwnProperty('password') && user.password !== '') {
        newuser.password = user.password;
    } else {
        newuser.password = genPass();
    }
    if (user.hasOwnProperty('conpin') && user.conpin !== '') {
        newuser.conpin = user.conpin;
    } else {
        switch (newuser.context) {
            case fastiConf.apiallow:
                newuser.conpin = '$${modconpin}';
                break;
            default:
                newuser.conpin = '$${defconpin}';
        }
    }
    if (user.hasOwnProperty('name')) {
        newuser.name = user.name.trim();
    } else {
        newuser.name = mywholeuser.name;
    }
    if (user.hasOwnProperty('polymac') && user.polymac !== '') {
        newuser.polymac = user.polymac.trim();
    } else {
        newuser.polymac = 'none';
    }
    let userDirFile = path.join(Contexts[mywholeuser.context].path, `${mywholeuser.id}.xml`);
    let userLinDir = path.join(Provpaths.linphone, `${mywholeuser.id}`)
    fs.rmdirSync(userLinDir, { recursive: true })
    fs.unlinkSync(userDirFile)
    if (mywholeuser.polymac !== 'none') {
        let userPolyDir = path.join(Provpaths.polycom, `${mywholeuser.polymac}`)
        fs.rmdirSync(userPolyDir, { recursive: true })
    }
    let newuserXml = templates.getUserFile(newuser);
    let newuserFile = path.join(Contexts[newuser.context].path, `${newuser.id}.xml`);
    fs.writeFileSync(newuserFile, newuserXml);
    if (newuser.polymac !== 'none') {
        polyProvUser(newuser, xmlState)
    }
    linProvUser(newuser, xmlState);
    modiusers.done.push(newuser);
    return;
}

// functions
const newUsers = (xmlState, users) => new Promise((resolve, reject) => {
    if (users == []) {
        reject('no users given');
    }
    let newusers = { op: 'users/add', done: [], failed: [] };
    users.forEach(usr => {
        buildNewUser(xmlState, usr, newusers);
    })
    reloadxml.run(xmlState)
        .then(msg => {
            console.log(`reloadxml after newUsers: ${msg.trim()}`)
        })
        .catch(err => {
            console.log(err)
            reject(err)
        });
    resolve(newusers);
});

const modUsers = (xmlState, users) => new Promise((resolve, reject) => {
    if (users == []) {
        reject('no users given');
    }
    let modiusers = { op: 'users/mod', done: [], failed: [] };
    users.forEach(usr => {
        modUser(xmlState, usr, modiusers);
    })
    reloadxml.run(xmlState)
        .then(msg => {
            console.log(`reloadxml after modUsers: ${msg.trim()}`)
        })
        .catch(err => {
            console.log(err)
            reject(err)
        });
    resolve(modiusers);
});

const delUsers = (xmlState, users) => new Promise((resolve, reject) => {
    if (users == []) {
        reject('no users given');
    }
    let delusers = { op: 'users/del', done: [], failed: [] };
    users.forEach(usr => {
        delUser(xmlState, usr, delusers);
    })
    reloadxml.run(xmlState)
        .then(msg => {
            console.log(`reloadxml after delUsers: ${msg.trim()}`)
        })
        .catch(err => {
            console.log(err)
            reject(err)
        });
    resolve(delusers);
});

const rebUsers = (xmlState) => new Promise((resolve, reject) => {
    if (xmlState.users == []) {
        reject('no users given');
    }
    let rebuilt = { op: 'users/rebuild', done: [], failed: [] }
    xmlState.users.forEach(usr => {
        rebuildUser(usr, rebuilt);
    })
    reloadxml.run(xmlState)
        .then(msg => {
            console.log(`reloadxml after rebUsers: ${msg.trim()}`)
        })
        .catch(err => {
            console.log(err)
            reject(err)
        });
    resolve(rebuilt);
})

const reprovUsers = (xmlState) => new Promise((resolve, reject) => {
    if (xmlState.users == []) {
        reject('no users given');
    }
    let reproved = { op: 'users/reprov', done: [], failed: [] }
    xmlState.users.forEach(usr => {
        reprovUser(usr, reproved, xmlState);
    })
    resolve(reproved);
})

// conference functions
const buildPolyDir = (xmlState) => {
    for (let ctx of myCtx) {
        let confcols = getConfArrays(xmlState)
        switch (ctx) {
            case fastiConf.apiallow: {
                for (let user of xmlState.users.filter(usr => usr.context == ctx && usr.polymac != 'none')) {
                    let dirxml = conftpl.getPolyDir(confcols[fastiConf.apiallow], user)
                    let dirpath = path.join(Provpaths.polycom, `${user.polymac}/${user.polymac}-directory.xml`)
                    fs.writeFileSync(dirpath, dirxml);
                }
                break;
            }
            case fastiConf.allow: {
                for (let user of xmlState.users.filter(usr => usr.context == ctx && usr.polymac != 'none')) {
                    let dirxml = conftpl.getPolyDir(confcols[fastiConf.allow], user)
                    let dirpath = path.join(Provpaths.polycom, `${user.polymac}/${user.polymac}-directory.xml`)
                    fs.writeFileSync(dirpath, dirxml);
                }
                break;
            }
            case fastiConf.disallow: {
                for (let user of xmlState.users.filter(usr => usr.context == ctx && usr.polymac != 'none')) {
                    let dirxml = conftpl.getPolyDir(confcols[fastiConf.disallow], user)
                    let dirpath = path.join(Provpaths.polycom, `${user.polymac}/${user.polymac}-directory.xml`)
                    fs.writeFileSync(dirpath, dirxml);
                }
                break;
            }
            default:
                ;
        }
    }
}

const buildNewConf = (xmlState, conf, newconfs) => {
    let newconf = {}
    if (xmlState.conferences.map(cnf => cnf.name).includes(conf.name)) {
        newconfs.failed.push({
            'error': 'name already taken',
            'conference': conf
        })
        return;
    }
    if (!xmlState.conferencetypes.includes(conf.type)) {
        newconfs.failed.push({
            'error': 'type not implementet',
            'conference': conf
        })
        return;
    }
    if (!(Contexts.hasOwnProperty(conf.context))) {
        newconfs.failed.push({
            'error': 'context does not exist',
            'conference': conf
        })
        return;
    }
    newconf.num = getNext(xmlState, 'conf', conf.context);
    newconf.type = conf.type;
    newconf.context = conf.context;
    newconf.name = conf.name.trim();
    let newconfXml = conftpl.getConfFile(newconf);
    let newconfFile = path.join(Confpath, `${newconf.num}.xml`);
    fs.writeFileSync(newconfFile, newconfXml);
    newconfs.done.push(newconf);
    xmlState.conferences.push(newconf);
    return;
}

const delConf = (xmlState, conf, delconfs) => {
    let deletet = xmlState.conferences.filter(cnf => cnf.num == conf.num)
    if (deletet.length < 1) {
        delconfs.failed.push({
            'error': `no conference ${conf.num}`,
            'conference': conf
        })
        return;
    }
    let delconfFile = path.join(Confpath, `${conf.num}.xml`);
    fs.unlinkSync(delconfFile)
    delconfs.done.push(deletet[0])
    return;
}

const modConf = (xmlState, conf, modconfs) => {
    let modded = xmlState.conferences.filter(cnf => cnf.num == conf.num)
    if (modded.length < 1) {
        modconfs.failed.push({
            'error': `no conference ${conf.num}`,
            'conference': conf
        })
        return;
    }
    let oldconf = modded[0]
    if (!conf.hasOwnProperty('name')) {
        conf.name = oldconf.name
    }
    if (!conf.hasOwnProperty('context')) {
        conf.context = oldconf.context
    }
    if (!conf.hasOwnProperty('type')) {
        conf.type = oldconf.type
    }
    let moddedconf = {}
    if (oldconf.context == conf.context) {
        moddedconf.num = conf.num
    } else {
        if (!(Contexts.hasOwnProperty(conf.context))) {
            modconfs.failed.push({
                'error': 'context does not exist',
                'conference': conf
            })
            return;
        }
        moddedconf.num = getNext(xmlState, 'conf', conf.context)
    }
    if (oldconf.name == conf.name) {
        moddedconf.name = conf.name
    } else {
        if (xmlState.conferences.map(cnf => cnf.name).includes(conf.name)) {
            modconfs.failed.push({
                'error': 'name already taken',
                'conference': conf
            })
            return;
        } else {
            moddedconf.name = conf.name
        }
    }
    if (!xmlState.conferencetypes.includes(conf.type)) {
        modconfs.failed.push({
            'error': 'type not implementet',
            'conference': conf
        })
        return;
    }
    moddedconf.type = conf.type
    let oldconfFile = path.join(Confpath, `${oldconf.num}.xml`);
    fs.unlinkSync(oldconfFile)
    let moddedconfXml = conftpl.getConfFile(moddedconf);
    let moddedconfFile = path.join(Confpath, `${moddedconf.num}.xml`);
    fs.writeFileSync(moddedconfFile, moddedconfXml);
    modconfs.done.push(moddedconf);
    xmlState.conferences.push(moddedconf);
    return;
}

const newConfs = (xmlState, conferences) => new Promise((resolve, reject) => {
    if (conferences == []) {
        reject('no conferences given');
    }
    let newconfs = { op: 'conferences/add', done: [], failed: [] };
    conferences.forEach(conf => {
        buildNewConf(xmlState, conf, newconfs);
    })
    reloadxml.run(xmlState)
        .then(msg => {
            console.log(`reloadxml after newConfs: ${msg.trim()}`)
        })
        .catch(err => {
            console.log(err)
            reject(err)
        });
    resolve(newconfs);
});

const modConfs = (xmlState, conferences) => new Promise((resolve, reject) => {
    if (conferences == []) {
        reject('no conferences given');
    }
    let modconfs = { op: 'conferences/mod', done: [], failed: [] };
    conferences.forEach(conf => {
        modConf(xmlState, conf, modconfs);
    })
    reloadxml.run(xmlState)
        .then(msg => {
            console.log(`reloadxml after modConfs: ${msg.trim()}`)
        })
        .catch(err => {
            console.log(err)
            reject(err)
        });
    resolve(modconfs);
});

const delConfs = (xmlState, conferences) => new Promise((resolve, reject) => {
    if (conferences == []) {
        reject('no conferences given');
    }
    let delconfs = { op: 'conferences/del', done: [], failed: [] };
    conferences.forEach(conf => {
        delConf(xmlState, conf, delconfs);
    })
    reloadxml.run(xmlState)
        .then(msg => {
            console.log(`reloadxml after delConfs: ${msg.trim()}`)
        })
        .catch(err => {
            console.log(err)
            reject(err)
        });
    resolve(delconfs);
});

const rebuildContacts = (xmlState) => new Promise((resolve, reject) => {
    if (xmlState == {}) {
        reject('xmlstate empty')
    }
    let recon = { op: 'conferences/rebuildcontacts', done: '' }
    buildPolyDir(xmlState);
    for (let usr of xmlState.users) {
        linProvUser(usr, xmlState)
    }
    recon.done = new Date()
    resolve(recon);
})


exports.newUsers = newUsers;
exports.rebUsers = rebUsers;
exports.reprovUsers = reprovUsers;
exports.delUsers = delUsers;
exports.modUsers = modUsers;
exports.newConfs = newConfs;
exports.delConfs = delConfs;
exports.modConfs = modConfs;
exports.rebuildContacts = rebuildContacts;