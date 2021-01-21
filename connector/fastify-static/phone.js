/**
 * verto communicator
 */

const provpaths = require('../config').getConfig('provisioningpaths')

async function vcroutes(fastify, options) {
    fastify.register(require('fastify-static'), {
        root: provpaths.vertocom,
        prefix: '/phone/'
    })

    fastify.get('/phone/config.json', async function (req, reply) {
        let id = req.user.id
        let password = req.user.password
        return { login: id,
                password: password }
    })
}

module.exports = vcroutes