/**
 * Reloadxml, after config-update
 */

const API = require('../apis/esapi');

const run = () => new Promise((resolve, reject) => {
    API.sendbgapi('reloadxml')
    .then(answer => {
        resolve(answer);
    })
    .catch(error => {
        reject(error);
    });
});

exports.run = run;