/**
 * Websocket connection to propagate liveState
 */

function noop() { }

function heartbeat() {
    this.isAlive = true;
}

async function liveroutes(fastify, options) {

    fastify.register(require('fastify-websocket'), {
        options: {
            clientTracking: true,
        }
    })

    fastify.addHook('onRequest', (req, repl, done) => {
        console.log(req.headers)
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

        fastify.liveState.on('newLiveState', data => {
            fastify.websocketServer.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify(fastify.liveState.conferences))
                }
            })
        })
    })
}

module.exports = liveroutes