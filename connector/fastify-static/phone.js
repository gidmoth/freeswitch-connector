/**
 * verto communicator
 */

const provpaths = require('../config').getConfig('provisioningpaths')

async function vcroutes(fastify, options) {
    fastify.register(require('fastify-static'), {
        root: provpaths.vertocom,
        serve: false
    })

    fastify.get('/userinfo', async function (req, reply) {
        let rsp =  req.user
        rsp.wss_binding = fastify.xmlState.globals.wss_binding
        rsp.internal_tls_port = fastify.xmlState.globals.internal_tls_port
        return rsp
    })

    fastify.get('/', async function (req, reply) {
        return reply.sendFile('index.html')
    })

    fastify.get('/poster.png', async function (req, reply) {
        return reply.sendFile('poster.png')
    })
}

module.exports = vcroutes