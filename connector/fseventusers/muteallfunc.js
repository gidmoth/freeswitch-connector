/**
 * Function to give moderators a muteall control on '*'
 */

const API = require('../apis/esapi');

const run = (conference) => new Promise((resolve, reject) => {
    API.sendbgapi(`conference ${conference} mute all`)
    .then(answer => {
        resolve(answer);
    })
    .catch(error => {
        reject(error);
    });
});

exports.run = run;