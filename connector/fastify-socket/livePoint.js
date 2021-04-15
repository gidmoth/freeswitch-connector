async function liveroutes (fastify, options) {

    fastify.register(require('fastify-websocket'), {
        options: {
            clientTracking: true
        }
    })
    
    fastify.get('/api/live', { websocket: true }, (conn, req) => {
        conn.socket.on('message', message => {
            conn.socket.send(`got message: ${message}`)
        })
        fastify.websocketServer.clients.forEach(function each(client) {
            if (client.readyState === 1) {
                client.send(JSON.stringify(fastify.liveState.conferences))
            }
        })
    })
    
}

module.exports = liveroutes