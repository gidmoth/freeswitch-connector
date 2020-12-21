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
            ;
            // ...
            break;
        case Event.Channel.HANGUP:
            ;
            // ...
            break;
        case Event.BACKGROUND_JOB:
            let jobname = event.getHeader('Job-Command');
            if(jobname == 'reloadxml' && event.getBody().startsWith('+OK')) {
                maintain.updateXmlState(xmlState);
                console.log(`${jobname}: ${event.getBody()}`);
            } else {
                console.log(`${jobname}`);
            }
            break;
        default:
            ;
            // A new unhandled event has been received...
            break;
    }
};

exports.handle = handle;