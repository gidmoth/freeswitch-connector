/**
 * Switch by Event
 */

const maintain = require('../maintainance');

const Event = {
    Channel: {
        CREATE: 'CHANNEL_CREATE',
        HANGUP: 'CHANNEL_HANGUP',
    },
    BACKGROUND_JOB: 'BACKGROUND_JOB'
};

const handle = (event, xmlState) => {
    const eventName = event.getHeader('Event-Name');
    switch (eventName) {
        case Event.Channel.CREATE:
            console.log(eventName);
            // ...
            break;
        case Event.Channel.HANGUP:
            console.log(eventName);
            // ...
            break;
        case Event.BACKGROUND_JOB:
            let jobname = event.getHeader('Job-Command');
            if(jobname == 'reloadxml') {
                maintain.updateXmlState(xmlState);
                console.log(`${jobname}: ${event.getBody()}`);
            } else {
                console.log(`${eventName}: ${jobname}`);
            }
            break;
        default:
            console.log(eventName);
            // A new unhandled event has been received...
            break;
    }
};

exports.handle = handle;