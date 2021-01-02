/**
 * Endpoint for polycom provisioning
 */


const provpaths = require('../config').getConfig('provisioningpaths')

async function linphoneroutes(fastify, options) {
    fastify.register(require('fastify-static'), {
        root: provpaths.linphone,
        prefix: '/linphone/',
        serve: false
    })

    fastify.get('/linphone', async function (req, reply) {
        let id = req.user.id
        return reply.sendFile(`${id}/linphone.xml`)
    })
}

module.exports = linphoneroutes