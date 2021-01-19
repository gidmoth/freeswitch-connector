/**
 * Switch by Event
 */

const maintain = require('../maintainance');
const muteall = require('../fseventusers/muteallfunc')
const record  = require('../fseventusers/recordingfuncts')
const freeswitchparams = require('../config').getConfig('freeswitch')
const recpath = freeswitchparams.recordings
const say = require('./leasay')

const Event = {
    Channel: {
        CREATE: 'CHANNEL_CREATE',
        HANGUP: 'CHANNEL_HANGUP',
    },
    BACKGROUND_JOB: 'BACKGROUND_JOB'
};

const handle = (event, xmlState, liveState) => {
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
                case 'conference': {
                    let subcommand = event.getHeader('Job-Command-Arg')
                    switch (true) {
                        case (subcommand.includes('recording start')): {
                            console.log(event.serialize('json'))
                            let conference = event.getHeader('Conference-Name')
                            let  file = event.getBody().split(' ')[3].trim()
                            liveState.recstates[conference]  =  {}
                            liveState.recstates[conference].state = 'running'
                            liveState.recstates[conference].file = file
                            say.leaSay(conference, 'start')
                            .then(answer => {
                                console.log(answer)
                            })
                            .catch(err => {
                                console.log(err)
                            })
                            console.log(JSON.stringify(liveState))
                            break;
                        }
                        case (subcommand.includes('recording pause')): {
                            let conference = event.getHeader('Conference-Name')
                            liveState.recstates[conference].state = 'paused'
                            say.leaSay(conference, 'pausing')
                            .then(answer => {
                                console.log(answer)
                            })
                            .catch(err => {
                                console.log(err)
                            })
                            break;
                        }
                        case (subcommand.includes('recording resume')): {
                            let conference = event.getHeader('Conference-Name')
                            liveState.recstates[conference].state = 'running'
                            say.leaSay(conference, 'resume')
                            .then(answer => {
                                console.log(answer)
                            })
                            .catch(err => {
                                console.log(err)
                            })
                            break;
                        }
                        case (subcommand.includes('recording stop')): {
                            let conference = event.getHeader('Conference-Name')
                            delete liveState.recstates[conference]
                            say.leaSay(conference, 'stop')
                            .then(answer => {
                                console.log(answer)
                            })
                            .catch(err => {
                                console.log(err)
                            })
                            break;
                        }
                        case (subcommand.includes('recording check')): {
                            let conference = event.getHeader('Conference-Name')
                            break;
                        }
                    }
                }
                default: {
                    //console.log(event.serialize('json'))
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
                    let filename = `${recpath}/${conference}-${new Date().toISOString()}.wav`
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
                    record.chekrec(conference)
                    .then(answer => {
                        if (answer.startsWith('-ERR')) {
                            console.log(`ERROR: conference ${conference} is not being recorded`)
                        } else {
                            let  file = answer.split(' ')[3]
                            record.pauserec(conference, file)
                        }
                    })
                    .catch(err => {
                        console.log(err)
                    })
                    break;
                }
                case 'resumerecording': {
                    let conference = event.getHeader('Conference-Name')
                    record.chekrec(conference)
                    .then(answer => {
                        if (answer.startsWith('-ERR')) {
                            console.log(`ERROR: conference ${conference} is not being recorded`)
                        } else {
                            let  file = answer.split(' ')[3]
                            record.resumerec(conference, file)
                        }
                    })
                    .catch(err => {
                        console.log(err)
                    })
                    break;
                }
                case 'stoprecording': {
                    let conference = event.getHeader('Conference-Name')
                    record.stoprec(conference, 'all')
                    .then(answer => {
                        console.log(answer)
                    })
                    .catch(err => {
                        console.log(err)
                    })
                    break;
                }
                case 'checkrecording': {
                    let conference = event.getHeader('Conference-Name')
                    record.chekrec(conference)
                    .then(answer => {
                        console.log(answer)
                    })
                    .catch(err => {
                        console.log(err)
                    })
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