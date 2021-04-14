/**
 * Monitor all events
 */

const Conn = require('../apis/esapi');
const Eswitch = require('./eventswitch');

const startMon = (xmlState, liveState) => {
    Conn.connect()
    .then(connection => {
        // Subscribe to all FreeSWITCH events:
        connection.subscribe(Conn.ALL_EVENTS);
        connection.on(Conn.Event.RECEIVED, event => {
            // A new FreeSWITCH event has been received!
            Eswitch.handle(event, xmlState, liveState);
        })
    })
    .catch(error => {
        // An error connecting to FreeSWITCH occurred!
        console.log("Monitor Error", error);
    });
};

exports.startMon = startMon;