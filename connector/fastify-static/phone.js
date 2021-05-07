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
        return req.user
    })

    fastify.get('/', async function (req, reply) {
        return reply.sendFile('index.html')
    })
}

module.exports = vcroutes