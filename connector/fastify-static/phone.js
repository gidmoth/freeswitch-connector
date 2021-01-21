/**
 * verto communicator
 */

const provpaths = require('../config').getConfig('provisioningpaths')

async function vcroutes(fastify, options) {
    fastify.register(require('fastify-static'), {
        root: provpaths.vertocom
    })

    fastify.get('/config.json', async function (req, reply) {
        return { login: req.user.id,
            password: req.user.password,
            name: req.user.name,
            email: req.user.email }
    })

    fastify.get('/', async function (req, reply) {
        return reply.sendFile('index.html')
    })
}

module.exports = vcroutes