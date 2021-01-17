/**
 * Switch by Event
 */

const maintain = require('../maintainance');
const muteall = require('../fseventusers/muteallfunc')
const record  = require('../fseventusers/recordingfuncts')

const Event = {
    Channel: {
        CREATE: 'CHANNEL_CREATE',
        HANGUP: 'CHANNEL_HANGUP',
    },
    BACKGROUND_JOB: 'BACKGROUND_JOB'
};

const handle = (event, xmlState) => {
    let eventName = event.getHeader('Event-Name');
    switch (eventName) {
        case Event.Channel.CREATE: {
            ;
            // ...
            break;
        }
        case Event.Channel.HANGUP: {
            ;
            // ...
            break;
        }
        case Event.BACKGROUND_JOB: {
            let jobname = event.getHeader('Job-Command');
            switch (jobname) {
                case 'reloadxml': {
                    if (event.getBody().startsWith('+OK')) {
                        maintain.updateXmlState(xmlState);
                        console.log(`${jobname}: ${event.getBody().trim()}`);
                    } else {
                        console.log(`ERROR: ${jobname}: ${event.getBody().trim()}`)
                    }
                    break;
                }
                default: {
                    // console.log(jobname)
                    // console.log(event.getBody())
                    break;
                }
            }
        }
        case 'CUSTOM': {
            let mymsg = event.getHeader('Data')
            switch (mymsg) {
                case 'muteall': {
                    let conference = event.getHeader('Conference-Name')
                    muteall.run(conference)
                    .then(answer => {
                        console.log(answer)
                    })
                    .catch(err => {
                        console.log(err)
                    })
                    break;
                }
                case 'startrecording': {
                    let conference = event.getHeader('Conference-Name')
                    let filename = `${conference}-${new Date()}.wav`
                    record.startrec(conference, filename)
                    .then(answer => {
                        console.log(answer)
                    })
                    .catch(err => {
                        console.log(err)
                    })
                    break;
                }
                case 'pauserecording': {
                    let conference = event.getHeader('Conference-Name')
             
                    break;
                }
                case 'resumerecording': {
                    let conference = event.getHeader('Conference-Name')
             
                    break;
                }
                case 'stoprecording': {
                    let conference = event.getHeader('Conference-Name')
             
                    break;
                }
                case 'checkrecording': {
                    let conference = event.getHeader('Conference-Name')
                    console.log(event.serialize('json'))
                    break;
                }
                default: {
                    break;
                }

            }
        }
        default: {
        //    console.log(eventName)
        //    console.log(event.serialize('json'))
        //    console.log(event.getBody())
            break;
        }
    }
};

exports.handle = handle;