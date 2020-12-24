/**
 * Endpoint for polycom provisioning
 */


const provpaths = require('../config').getConfig('provisioningpaths')

async function polycomroutes (fastify, options) {
    console.log(JSON.stringify(fastify))
    fastify.register(require('fastify-static'), {
        root: provpaths.polycom,
        prefix: '/polycom/',
        list: true
    })

//    fastify.get('/:file', async function (req, reply) {
//        return reply.sendFile('file')
//    })
}

module.exports = polycomroutes