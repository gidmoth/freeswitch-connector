/**
 * Websocket connection to propagate liveState
 */


const fastiConf = require('../config').getConfig('fasti');

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
            console.log('got wrong query!')
            conn.socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
            conn.socket.destroy()
            return repl.send('Unauthorized')
        }
        if (! checkCreds(conn.query.login, fastify.xmlState.users)) {
            console.log('got wrong creds!')
            conn.socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
            conn.socket.destroy()
            return repl.send('Unauthorized')
        }
        console.log('yay, login!')
        done()
    })

    fastify.get('/api/live', { websocket: true }, (conn, req) => {


        //        console.log(JSON.stringify(req.query))

        conn.socket.on('open', heartbeat)

        conn.socket.on('pong', heartbeat)

        const interval = setInterval(() => {
            //            console.log(`my clients: ${fastify.websocketServer.clients.size}`)
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
            conn.socket.send(`got message: ${message}`)
        })

        fastify.liveState.on('newLiveState', () => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify(fastify.liveState.conferences))
                }
            })
        })
    })
}

module.exports = liveroutes