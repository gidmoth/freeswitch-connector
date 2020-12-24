/**
 * Reloadxml, after config-update
 */

const API = require('../apis/esapi');

const run = (xmlState) => new Promise((resolve, reject) => {
    API.sendbgapi('reloadxml')
    .then(answer => {
        xmlState.info.reloadxml.lastrun = new Date();
        xmlState.info.reloadxml.lastmsg = answer.trim();
        resolve(answer);
    })
    .catch(error => {
        reject(error);
    });
});

exports.run = run;