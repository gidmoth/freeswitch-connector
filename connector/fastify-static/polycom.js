/**
 * Endpoint for polycom provisioning
 */


const provpaths = require('../config').getConfig('provisioningpaths')

async function polycomroutes (fastify, options) {
    fastify.register(require('fastify-static'), {
        root: provpaths.polycom,
        prefix: '/polycom/'
    })

    function getName (req) {
        return Buffer.from(req.headers.authorization.split(' ')[1], 'base64')
            .toString()
            .split(':')[0]
    }

    function getMac (user, userarray) {
        let mac = userarray.filter(usr => {
            return usr.name == user
        })[0].polymac
        return mac
    }

    fastify.get('/polycom', async function (req, reply) {
        let mac = getMac(getName(req), this.xmlState.users)
        return mac
    })

    fastify.get('/polycom/', async function (req, reply) {
        let mac = getMac(getName(req), this.xmlState.users)
        return mac
    })

    fastify.get('/polycom/:file', async function (req, reply) {
        let mac = getMac(getName(req), this.xmlState.users)
        return mac
    })

    fastify.post('/polycom/:file', async function (req, reply) {
        return req.params.file
    })

//    fastify.get('/:file', async function (req, reply) {
//        return reply.sendFile('file')
//    })
}

module.exports = polycomroutes