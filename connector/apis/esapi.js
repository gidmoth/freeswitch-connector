/**
 * main connector to freeswitch
 */

const ESL = require('modesl');

const FsConf = require('../config.js').getConfig('freeswitch');

const Event = {
    Connection: {
        READY: 'esl::ready',
        CLOSED: 'esl::end',
        ERROR: 'error',
    },
    RECEIVED: 'esl::event::**',
};

const ALL_EVENTS = 'all';
let connection = null;

const connect = () => new Promise((resolve, reject) => {
    if (connection !== null && connection.connected()) {
        resolve(connection);
    } else {
        // Opening new FreeSWITCH event socket connection...
        connection = new ESL.Connection(FsConf.ip, FsConf.port, FsConf.pw);
        connection.on(Event.Connection.ERROR, (err) => {
            // Error connecting to FreeSWITCH!
            console.log(JSON.stringify(err));
            reject('Connection error');
        });
        connection.on(Event.Connection.CLOSED, () => {
            // Connection to FreeSWITCH closed!
            reject('Connection closed');
        });
        connection.on(Event.Connection.READY, () => {
            // Connection to FreeSWITCH established!
            resolve(connection);
        });
    }
});

const sendbgapi = (command) => new Promise((resolve, reject) => {
    connect()
    .then(connection => {
        connection.bgapi(command, response => {
            const responseBody = response.getBody();
            resolve(responseBody);
        });
    })
    .catch(error => {
        reject(error);
    });
});

exports.ALL_EVENTS = ALL_EVENTS;
exports.Event = Event;
exports.connect = connect;
exports.sendbgapi = sendbgapi;
