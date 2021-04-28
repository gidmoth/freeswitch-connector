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

exports.confLock = confLock;
exports.confUnlock = confUnlock;