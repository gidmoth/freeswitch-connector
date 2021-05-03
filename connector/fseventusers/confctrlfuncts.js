/**
 * functions to control conferences
 */

const API = require('../apis/esapi');

const confLock = (conference) => new Promise((resolve, reject) => {
    API.sendbgapi(`conference ${conference} lock`)
        .then(answer => {
            resolve(answer);
        })
        .catch(error => {
            reject(error);
        });
});

const confUnlock = (conference) => new Promise((resolve, reject) => {
    API.sendbgapi(`conference ${conference} unlock`)
        .then(answer => {
            resolve(answer);
        })
        .catch(error => {
            reject(error);
        });
});

const confKickAll = (conference) => new Promise((resolve, reject) => {
    API.sendbgapi(`conference ${conference} kick all`)
        .then(answer => {
            resolve(answer);
        })
        .catch(error => {
            reject(error);
        })
});

const confKickMem = (conference, member) => new Promise((resolve, reject) => {
    API.sendbgapi(`conference ${conference} kick ${member}`)
        .then(answer => {
            resolve(answer);
        })
        .catch(error => {
            reject(error);
        })
});

const confMuteMem = (conference, member) => new Promise((resolve, reject) => {
    API.sendbgapi(`conference ${conference} mute ${member}`)
        .then(answer => {
            resolve(answer);
        })
        .catch(error => {
            reject(error);
        })
});

const confUnmuteMem = (conference, member) => new Promise((resolve, reject) => {
    API.sendbgapi(`conference ${conference} unmute ${member}`)
        .then(answer => {
            resolve(answer);
        })
        .catch(error => {
            reject(error);
        })
});

exports.confLock = confLock;
exports.confUnlock = confUnlock;
exports.confKickAll = confKickAll;
exports.confKickMem = confKickMem;
exports.confMuteMem = confMuteMem;
exports.confUnmuteMem =  confUnmuteMem;