/**
 * Websocket connection to propagate liveState
 */


const fastiConf = require('../config').getConfig('fasti');
const confCtrl = require('../fseventusers/confctrlfuncts');
const record = require('../fseventusers/recordingfuncts')
const freeswitchparams = require('../config').getConfig('freeswitch')
const recpath = freeswitchparams.recordings
const muteall = require('../fseventusers/muteallfunc')

function noop() { }

function heartbeat() {
    this.isAlive = true;
}

function checkCreds(cstring, arr) {
    let user = arr.filter(usr => { return usr.name === `${cstring.split(':')[0]}` })[0]
    if (user !== undefined
        && user.password === `${cstring.split(':')[1]}`
        && user.context === fastiConf.apiallow) {
        return true
    }
    return false
}

async function liveroutes(fastify, options) {

    fastify.register(require('fastify-websocket'), {
        options: {
            clientTracking: true,
        }
    })

    fastify.addHook('onRequest', (conn, repl, done) => {
        if (conn.query.login === undefined) {
            conn.socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
            conn.socket.destroy()
            return repl.send('Unauthorized')
        }
        if (!checkCreds(conn.query.login, fastify.xmlState.users)) {
            conn.socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
            conn.socket.destroy()
            return repl.send('Unauthorized')
        }
        done()
    })

    fastify.get('/api/live', { websocket: true }, (conn, req) => {
        conn.socket.on('open', heartbeat)
        conn.socket.on('pong', heartbeat)
        const interval = setInterval(() => {
            fastify.websocketServer.clients.forEach(sock => {
                if (sock.isAlive === false) {
                    console.log('destroying unresponsive client')
                    return sock.terminate()
                }
                sock.isAlive = false
                sock.ping(noop)
            })
        }, 30000)

        fastify.websocketServer.on('close', () => {
            clearInterval(interval)
        })

        conn.socket.on('message', message => {
            try {
                let msg = JSON.parse(message)
                if (msg.req === undefined) {
                    conn.socket.send(`{"error":"wrong protocol"}`)
                    return
                }
                switch (msg.req) {
                    case 'init': {
                        conn.socket.send(`{"reply":"init","data":${JSON.stringify(fastify.liveState.conferences)}}`)
                        break
                    }
                    case 'exec': {
                        if (msg.conference === undefined) {
                            conn.socket.send(`{"error":"wrong protocol"}`)
                            return
                        }
                        if (msg.call === undefined) {
                            conn.socket.send(`{"error":"wrong protocol"}`)
                            return
                        }
                        let conference = msg.conference
                        let call = msg.call
                        switch (call) {
                            case 'lock': {
                                confCtrl.confLock(conference)
                                    .then(ans => {
                                        console.log(ans)
                                    })
                                    .catch(err => {
                                        conn.socket.send(`{"error":"${err}"}`)
                                    })
                                break;
                            }
                            case 'unlock': {
                                confCtrl.confUnlock(conference)
                                    .then(ans => {
                                        console.log(ans)
                                    })
                                    .catch(err => {
                                        conn.socket.send(`{"error":"${err}"}`)
                                    })
                                break;
                            }
                            case 'startrec': {
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
                            case 'pauserec': {
                                let posi = fastify.liveState.conferences.findIndex(conf => conf.name === conference)
                                let filename = fastify.liveState.conferences[posi].recording.file
                                record.pauserec(conference, filename)
                                    .then(answer => {
                                        console.log(answer)
                                    })
                                    .catch(err => {
                                        console.log(err)
                                    })
                                break;
                            }
                            case 'resumerec': {
                                let posi = fastify.liveState.conferences.findIndex(conf => conf.name === conference)
                                let filename = fastify.liveState.conferences[posi].recording.file
                                record.resumerec(conference, filename)
                                    .then(answer => {
                                        console.log(answer)
                                    })
                                    .catch(err => {
                                        console.log(err)
                                    })
                                break;
                            }
                            case 'stoprec': {
                                let posi = fastify.liveState.conferences.findIndex(conf => conf.name === conference)
                                let filename = fastify.liveState.conferences[posi].recording.file
                                record.stoprec(conference, filename)
                                    .then(answer => {
                                        console.log(answer)
                                    })
                                    .catch(err => {
                                        console.log(err)
                                    })
                                break;
                            }
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
                            case 'kickall': {
                                confCtrl.confKickAll(conference)
                                    .then(ans => {
                                        console.log(ans)
                                    })
                                    .catch(err => {
                                        conn.socket.send(`{"error":"${err}"}`)
                                    })
                                break;
                            }
                            default: {
                                conn.socket.send(`{"error":"wrong protocol"}`)
                                return
                            }
                        }
                        break
                    }
                    case 'memexec': {
                        if (msg.conference === undefined) {
                            conn.socket.send(`{"error":"wrong protocol"}`)
                            return
                        }
                        if (msg.call === undefined) {
                            conn.socket.send(`{"error":"wrong protocol"}`)
                            return
                        }
                        if (msg.member === undefined) {
                            conn.socket.send(`{"error":"wrong protocol"}`)
                            return
                        }
                        let conference = msg.conference
                        let call = msg.call
                        let member = msg.member
                        switch (call) {
                            case 'kick': {
                                confCtrl.confKickMem(conference, member)
                                    .then(ans => {
                                        console.log(ans)
                                    })
                                    .catch(err => {
                                        conn.socket.send(`{"error":"${err}"}`)
                                    })
                                break;
                            }
                            case 'mute': {
                                confCtrl.confMuteMem(conference, member)
                                    .then(ans => {
                                        console.log(ans)
                                    })
                                    .catch(err => {
                                        conn.socket.send(`{"error":"${err}"}`)
                                    })
                                break;
                            }
                            case 'unmute': {
                                confCtrl.confUnmuteMem(conference, member)
                                    .then(ans => {
                                        console.log(ans)
                                    })
                                    .catch(err => {
                                        conn.socket.send(`{"error":"${err}"}`)
                                    })
                                break;
                            }
                            default: {
                                conn.socket.send(`{"error":"wrong protocol"}`)
                                return
                            }
                        }
                        break
                    }
                    default: {
                        conn.socket.send(`{"error":"wrong protocol"}`)
                        break
                    }
                }
            } catch (e) {
                //console.log(e)
                conn.socket.send(`{"error":"wrong format"}`)
            }
        })

        fastify.liveState.on('newLiveState', () => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"newLiveState","data":${JSON.stringify(fastify.liveState.conferences)}}`)
                }
            })
        })

        fastify.liveState.on('newConference', (data) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"newConference","data":${JSON.stringify(data)}}`)
                }
            })
        })

        fastify.liveState.on('newMember', (conf, mem) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"newMember","conference":"${conf}","data":${JSON.stringify(mem)}}`)
                }
            })
        })

        fastify.liveState.on('floorchange', (conf, mem) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"floorchange","conference":"${conf}","data":${JSON.stringify(mem)}}`)
                }
            })
        })

        fastify.liveState.on('unmute', (conf, memid) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"unmute","conference":"${conf}","data":"${memid}"}`)
                }
            })
        })

        fastify.liveState.on('mute', (conf, memid) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"mute","conference":"${conf}","data":"${memid}"}`)
                }
            })
        })

        fastify.liveState.on('muteAll', (conf) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"muteAll","conference":"${conf}"}`)
                }
            })
        })

        fastify.liveState.on('recStop', (conf) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"recStop","conference":"${conf}"}`)
                }
            })
        })

        fastify.liveState.on('recResume', (conf, file) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"recResume","conference":"${conf}","file":"${file}"}`)
                }
            })
        })

        fastify.liveState.on('recPause', (conf, file) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"recPause","conference":"${conf}","file":"${file}"}`)
                }
            })
        })

        fastify.liveState.on('recStart', (conf, file) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"recStart","conference":"${conf}","file":"${file}"}`)
                }
            })
        })

        fastify.liveState.on('delConference', (conf) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"delConference","conference":"${conf}"}`)
                }
            })
        })

        fastify.liveState.on('delMember', (conf, memid) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"delMember","conference":"${conf}","data":"${memid}"}`)
                }
            })
        })

        fastify.liveState.on('lock', (conf) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"lock","conference":"${conf}"}`)
                }
            })
        })

        fastify.liveState.on('unlock', (conf) => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(`{"event":"unlock","conference":"${conf}"}`)
                }
            })
        })
    })
}

module.exports = liveroutes