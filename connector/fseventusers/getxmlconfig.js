/**
 * gets the current phrased config from freeswitch
 */

const API = require('../apis/esapi');

const getDir = () => new Promise((resolve, reject) => {
    API.sendbgapi('xml_locate directory')
    .then(answer => {
        resolve(answer);
    })
    .catch(error => {
        reject(error);
    });
});

const getDp = () => new Promise((resolve, reject) => {
    API.sendbgapi('xml_locate dialplan')
    .then(answer => {
        resolve(answer);
    })
    .catch(error => {
        reject(error);
    });
});

exports.getDir = getDir;
exports.getDp = getDp;