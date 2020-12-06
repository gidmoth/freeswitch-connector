/**
 * Switch by Event
 */

const Event = {
    Channel: {
        CREATE: 'CHANNEL_CREATE',
        HANGUP: 'CHANNEL_HANGUP',
    },
};

const handle = (event) => {
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
        default:
            console.log(eventName);
            // A new unhandled event has been received...
            break;
    }
};

exports.handle = handle;