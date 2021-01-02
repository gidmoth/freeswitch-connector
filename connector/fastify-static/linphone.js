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

    function getName(req) {
        return Buffer.from(req.headers.authorization.split(' ')[1], 'base64')
            .toString()
            .split(':')[0]
    }

    function getId(user, userarray) {
        let id = userarray.filter(usr => {
            return usr.name == user
        })[0].id
        return id
    }

    fastify.get('/linphone', async function (req, reply) {
        let id = getId(getName(req), this.xmlState.users)
        return reply.sendFile(`${id}/linphone.xml`)
    })
}

module.exports = linphoneroutes