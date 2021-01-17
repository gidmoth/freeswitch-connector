/**
 * Functions for recordingcontrol on  1,2,3,4 and 5
 */

const API = require('../apis/esapi');

const startrec = (conference, file) => new Promise((resolve, reject) => {
    API.sendbgapi(`conference ${conference} recording start ${file}`)
    .then(answer => {
        resolve(answer);
    })
    .catch(error => {
        reject(error);
    });
});

const pauserec = (conference, file) => new Promise((resolve, reject) => {
    API.sendbgapi(`conference ${conference} recording pause ${file}`)
    .then(answer => {
        resolve(answer);
    })
    .catch(error => {
        reject(error);
    });
});

const resumerec = (conference, file) => new Promise((resolve, reject) => {
    API.sendbgapi(`conference ${conference} recording resume ${file}`)
    .then(answer => {
        resolve(answer);
    })
    .catch(error => {
        reject(error);
    });
});

const stoprec = (conference, file) => new Promise((resolve, reject) => {
    API.sendbgapi(`conference ${conference} recording stop ${file}`)
    .then(answer => {
        resolve(answer);
    })
    .catch(error => {
        reject(error);
    });
});

const chekrec = (conference, file) => new Promise((resolve, reject) => {
    API.sendbgapi(`conference ${conference} recording check`)
    .then(answer => {
        resolve(answer);
    })
    .catch(error => {
        reject(error);
    });
});

exports.startrec = startrec;
exports.pauserec = pauserec;
exports.resumerec = resumerec;
exports.stoprec  = stoprec;
exports.chekrec = chekrec;