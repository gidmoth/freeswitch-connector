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
const confCtrl = require('../fseventusers/confctrlfuncts');

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
                    let conference = subcommand.split(' ')[0]
                    let posi = liveState.conferences.findIndex(conf => conf.name === conference)
                    switch (true) {
                        case (subcommand.includes('recording start')): {
                            let file = event.getBody().split(' ')[3].trim()
                            liveState.conferences[posi].recording.status = 'running'
                            liveState.conferences[posi].recording.file = file
                            liveState.emit('recStart', conference, file)
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
                            liveState.conferences[posi].recording.status = 'paused'
                            liveState.emit('recPause', conference, liveState.conferences[posi].recording.file)
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
                            liveState.conferences[posi].recording.status = 'running'
                            liveState.emit('recResume', conference, liveState.conferences[posi].recording.file)
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
                            liveState.conferences[posi].recording.status = 'norec'
                            delete liveState.conferences[posi].recording.file
                            liveState.emit('recStop', conference)
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
                            switch (liveState.conferences[posi].recording.status) {
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
                                case 'norec': {
                                    say.leaSay(conference, 'norec')
                                        .then(answer => {
                                            console.log(answer)
                                        })
                                        .catch(err => {
                                            console.log(err)
                                        })
                                    break;
                                }
                            }
                            break;
                        }
                        case (subcommand.includes('mute all')): {
                            liveState.conferences[posi].members.forEach(mem => {
                                mem.mute = true
                            });
                            if (liveState.conferences[posi].floor.mute !== undefined) {
                                liveState.conferences[posi].floor.mute = true
                            }
                            liveState.emit('muteAll', conference)
                            break;
                        }
                        case (subcommand == 'json_list'): {
                            liveState.conferences = Parsers.listParse(JSON.parse(event.getBody()))
                            console.log(JSON.stringify(liveState.conferences))
                            liveState.emit('newLiveState')
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
                    let conference = event.getHeader('Conference-Name')
                    let posi = liveState.conferences.findIndex(conf => conf.name === conference)
                    let mymsg = event.getHeader('Data')
                    switch (mymsg) {
                        case 'muteall': {
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
                            switch (liveState.conferences[posi].recording.status) {
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
                                case 'norec': {
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
                            }
                            break;
                        }
                        case 'pauserecording': {
                            switch (liveState.conferences[posi].recording.status) {
                                case 'running': {
                                    record.pauserec(conference, liveState.conferences[posi].recording.file)
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
                                case 'norec': {
                                    say.leaSay(conference, 'norec')
                                        .then(answer => {
                                            console.log(answer)
                                        })
                                        .catch(err => {
                                            console.log(err)
                                        })
                                    break;
                                }
                            }
                            break;
                        }
                        case 'resumerecording': {
                            switch (liveState.conferences[posi].recording.status) {
                                case 'paused': {
                                    record.resumerec(conference, liveState.conferences[posi].recording.file)
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
                                case 'norec': {
                                    say.leaSay(conference, 'norec')
                                        .then(answer => {
                                            console.log(answer)
                                        })
                                        .catch(err => {
                                            console.log(err)
                                        })
                                    break;
                                }
                            }
                            break;
                        }
                        case 'stoprecording': {
                            switch (liveState.conferences[posi].recording.status) {
                                case 'running': {
                                    record.stoprec(conference, 'all')
                                        .then(answer => {
                                            console.log(answer)
                                        })
                                        .catch(err => {
                                            console.log(err)
                                        })
                                    break;
                                }
                                case 'paused': {
                                    record.stoprec(conference, 'all')
                                        .then(answer => {
                                            console.log(answer)
                                        })
                                        .catch(err => {
                                            console.log(err)
                                        })
                                    break;
                                }
                                case 'norec': {
                                    say.leaSay(conference, 'norec')
                                        .then(answer => {
                                            console.log(answer)
                                        })
                                        .catch(err => {
                                            console.log(err)
                                        })
                                    break;
                                }
                            }
                            break;
                        }
                        case 'checkrecording': {
                            record.chekrec(conference)
                                .then(answer => {
                                    console.log(answer)
                                })
                                .catch(err => {
                                    console.log(err)
                                })
                            break;
                        }
                        case 'conferenceunlock': {
                            confCtrl.confUnlock(conference)
                                .then(answer => {
                                    console.log(answer)
                                })
                                .catch(err => {
                                    console.log(err)
                                })
                            break;
                        }
                        case 'conferencelock': {
                            confCtrl.confLock(conference)
                                .then(answer => {
                                    console.log(answer)
                                })
                                .catch(err => {
                                    console.log(err)
                                })
                            break;
                        }
                        default: {
                            switch (event.getHeader('Action')) {
                                case 'conference-create': {
                                    let conf = Parsers.addConfParse(event)
                                    liveState.conferences.push(conf)
                                    break;
                                }
                                case 'add-member': {
                                    let mem = Parsers.addMemParse(event)
                                    liveState.conferences[posi].members.push(mem)
                                    liveState.conferences[posi].lastjoin = mem
                                    liveState.conferences[posi].memcount++
                                    if (liveState.conferences[posi].memcount === 1) {
                                        liveState.emit('newConference', liveState.conferences[posi])
                                    } else {
                                        liveState.emit('newMember', conference, mem)
                                    }
                                    break;
                                }
                                case 'floor-change': {
                                    if (event.getHeader('New-ID') === 'none') {
                                        return;
                                    }
                                    let mem = Parsers.addMemParse(event)
                                    liveState.conferences[posi].floor = mem
                                    liveState.emit('floorchange', conference, mem)
                                    break;
                                }
                                case 'unmute-member': {
                                    let memid = event.getHeader('Caller-Username')
                                    let idx = liveState.conferences[posi].members
                                        .findIndex(mem => mem.id === memid)
                                    liveState.conferences[posi].members[idx].mute = false
                                    if (liveState.conferences[posi].members[idx].id === liveState.conferences[posi].floor.id) {
                                        liveState.conferences[posi].floor.mute = false
                                    }
                                    console.log(`got ${liveState.listenerCount('unmute')} unmute listeners`)
                                    liveState.emit('unmute', conference, memid)
                                    break;
                                }
                                case 'mute-member': {
                                    let memid = event.getHeader('Caller-Username')
                                    let idx = liveState.conferences[posi].members
                                        .findIndex(mem => mem.id === memid)
                                    liveState.conferences[posi].members[idx].mute = true
                                    if (liveState.conferences[posi].members[idx].id === liveState.conferences[posi].floor.id) {
                                        liveState.conferences[posi].floor.mute = true
                                    }
                                    console.log(`got ${liveState.listenerCount('mute')} mute listeners`)
                                    liveState.emit('mute', conference, memid)
                                    break;
                                }
                                case 'conference-destroy': {
                                    liveState.conferences.splice(posi, 1)
                                    // liveState.emit('delConference', conference)
                                    break;
                                }
                                case 'del-member': {
                                    let mem = Parsers.addMemParse(event)
                                    let memid = event.getHeader('Caller-Username')
                                    let idx = liveState.conferences[posi].members
                                        .findIndex(mem => mem.id === memid)
                                    liveState.conferences[posi].members.splice(idx, 1)
                                    liveState.conferences[posi].lastleave = mem
                                    liveState.conferences[posi].memcount--
                                    if (liveState.conferences[posi].members.length === 0) {
                                        liveState.emit('delConference', conference)
                                    } else {
                                        liveState.emit('delMember', conference, memid)
                                    }
                                    break;
                                }
                                case 'lock': {
                                    liveState.conferences[posi].locked = true
                                    liveState.emit('lock', conference)
                                    break;
                                }
                                case 'unlock': {
                                    liveState.conferences[posi].locked = false
                                    liveState.emit('unlock', conference)
                                    break;
                                }
                                default: {
                                    //console.log(event.serialize('json'))
                                    break;
                                }
                            }
                            // console.log(event.serialize('json'))
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