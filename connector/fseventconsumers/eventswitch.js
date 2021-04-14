/**
 * Switch by Event
 */

const maintain = require('../maintainance');
const muteall = require('../fseventusers/muteallfunc')
const record = require('../fseventusers/recordingfuncts')
const freeswitchparams = require('../config').getConfig('freeswitch')
const recpath = freeswitchparams.recordings
const say = require('./leasay')
const Parsers = require('./switchParsers')

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
                    // console.log(event.serialize('json'))
                    let subcommand = event.getHeader('Job-Command-Arg')
                    switch (true) {
                        case (subcommand.includes('recording start')): {
                            let conference = subcommand.split(' ')[0]
                            let file = event.getBody().split(' ')[3].trim()
                            liveState.recstates[conference] = {}
                            liveState.recstates[conference].state = 'running'
                            liveState.recstates[conference].file = file
                            say.leaSay(conference, 'start')
                                .then(answer => {
                                    console.log(answer)
                                })
                                .catch(err => {
                                    console.log(err)
                                })
                            break;
                        }
                        case (subcommand.includes('recording pause')): {
                            let conference = subcommand.split(' ')[0]
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
                            let conference = subcommand.split(' ')[0]
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
                            let conference = subcommand.split(' ')[0]
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
                            // console.log(event.serialize('json'))
                            let conference = subcommand.split(' ')[0]
                            if (liveState.recstates.hasOwnProperty(`${conference}`)) {
                                switch (liveState.recstates[conference].state) {
                                    case 'running': {
                                        say.leaSay(conference, 'start')
                                            .then(answer => {
                                                console.log(answer)
                                            })
                                            .catch(err => {
                                                console.log(err)
                                            })
                                        break;
                                    }
                                    case 'paused': {
                                        say.leaSay(conference, 'pausing')
                                            .then(answer => {
                                                console.log(answer)
                                            })
                                            .catch(err => {
                                                console.log(err)
                                            })
                                        break;
                                    }
                                }
                                return;
                            }
                            say.leaSay(conference, 'norec')
                                .then(answer => {
                                    console.log(answer)
                                })
                                .catch(err => {
                                    console.log(err)
                                })
                            break;
                        }
                        case (subcommand == 'json_list'): {
                            // console.log(event.getBody())
                            liveState.conferences = Parsers.listParse(JSON.parse(event.getBody()))
                            console.log(JSON.stringify(liveState.conferences))
                            break;
                        }
                    }
                    break;
                }
                default: {
                    // console.log(event.serialize('json'))
                    break;
                }
            }
        }
        case 'CUSTOM': {
            // console.log(event.serialize('json'))
            switch (event.getHeader('Event-Subclass')) {
                case 'conference::maintenance': {
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
                            if (liveState.recstates.hasOwnProperty(`${conference}`)) {
                                switch (liveState.recstates[conference].state) {
                                    case 'running': {
                                        say.leaSay(conference, 'already')
                                            .then(answer => {
                                                console.log(answer)
                                            })
                                            .catch(err => {
                                                console.log(err)
                                            })
                                        break;
                                    }
                                    case 'paused': {
                                        say.leaSay(conference, 'paused')
                                            .then(answer => {
                                                console.log(answer)
                                            })
                                            .catch(err => {
                                                console.log(err)
                                            })
                                        break;
                                    }
                                }
                                return;
                            }
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
                            if (liveState.recstates.hasOwnProperty(`${conference}`)) {
                                switch (liveState.recstates[conference].state) {
                                    case 'running': {
                                        record.pauserec(conference, liveState.recstates[conference].file)
                                            .then(answer => {
                                                console.log(answer)
                                            })
                                            .catch(err => {
                                                console.log(err)
                                            })
                                        break;
                                    }
                                    case 'paused': {
                                        say.leaSay(conference, 'pausing')
                                            .then(answer => {
                                                console.log(answer)
                                            })
                                            .catch(err => {
                                                console.log(err)
                                            })
                                        break;
                                    }
                                }
                                return;
                            }
                            say.leaSay(conference, 'norec')
                                .then(answer => {
                                    console.log(answer)
                                })
                                .catch(err => {
                                    console.log(err)
                                })
                            break;
                        }
                        case 'resumerecording': {
                            let conference = event.getHeader('Conference-Name')
                            if (liveState.recstates.hasOwnProperty(`${conference}`)) {
                                switch (liveState.recstates[conference].state) {
                                    case 'paused': {
                                        record.resumerec(conference, liveState.recstates[conference].file)
                                            .then(answer => {
                                                console.log(answer)
                                            })
                                            .catch(err => {
                                                console.log(err)
                                            })
                                        break;
                                    }
                                    case 'running': {
                                        say.leaSay(conference, 'already')
                                            .then(answer => {
                                                console.log(answer)
                                            })
                                            .catch(err => {
                                                console.log(err)
                                            })
                                        break;
                                    }
                                }
                                return;
                            }
                            say.leaSay(conference, 'norec')
                                .then(answer => {
                                    console.log(answer)
                                })
                                .catch(err => {
                                    console.log(err)
                                })
                            break;
                        }
                        case 'stoprecording': {
                            let conference = event.getHeader('Conference-Name')
                            if (liveState.recstates.hasOwnProperty(`${conference}`)) {
                                record.stoprec(conference, 'all')
                                    .then(answer => {
                                        console.log(answer)
                                    })
                                    .catch(err => {
                                        console.log(err)
                                    })
                                return;
                            }
                            say.leaSay(conference, 'norec')
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
                            let conference = event.getHeader('Conference-Name')
                            console.log(event.serialize('json'))
                            break;
                        }
                    }
                    break;
                }
                default: {
                    // console.log(event.serialize('json'))
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