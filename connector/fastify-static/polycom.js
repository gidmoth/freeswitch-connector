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

    fastify.get('/polycom/sip.ld', async function (req, reply) {
        return reply.sendFile('ucs/sip.ld')
    })

    fastify.get('/polycom/sip.ver', async function (req, reply) {
        return reply.sendFile('ucs/sip.ver')
    })

    fastify.get('/polycom/:file', async function (req, reply) {
        let mac = getMac(getName(req), this.xmlState.users)
        return reply.sendFile(`${mac}/${req.params.file}`)
    })

    

    fastify.put('/polycom/:file', async function (req, reply) {
        console.log(`body: ${JSON.stringify(req.body)}`)
        console.log(`query: ${JSON.stringify(req.query)}`)
        console.log(`params: ${JSON.stringify(req.params)}`)
        console.log(`headers: ${JSON.stringify(req.headers)}`)
        console.log(`raw: ${req.raw.getHeader('Content-Type')}`)
        return req.params.file
    })

//    fastify.get('/:file', async function (req, reply) {
//        return reply.sendFile('file')
//    })
}

module.exports = polycomroutes