/**
 * Endpoint for polycom provisioning
 */


const provpaths = require('../config').getConfig('provisioningpaths')
const fs = require('fs')

async function polycomroutes(fastify, options) {
    fastify.register(require('fastify-static'), {
        root: provpaths.polycom,
        prefix: '/polycom/',
        serve: false
    })

    fastify.addContentTypeParser('*', { asString: true }, function (req, payload, done) {
        let data = ''
        payload.on('data', chunk => { data += chunk })
        payload.on('end', () => {
            done(null, data)
        })
    })

    function getName(req) {
        return Buffer.from(req.headers.authorization.split(' ')[1], 'base64')
            .toString()
            .split(':')[0]
    }

    function getMac(user, userarray) {
        let mac = userarray.filter(usr => {
            return usr.name == user
        })[0].polymac
        return mac
    }

    fastify.get('/polycom/:file', async function (req, reply) {
        if (req.params.file.endsWith('.ld') ||
            req.params.file.endsWith('.jpg') ||
            req.params.file.endsWith('.wav') ||
            req.params.file.endsWith('.ver')) {
            return reply.sendFile(`ucs/${req.params.file}`)
        }
        let mac = getMac(getName(req), this.xmlState.users)
        return reply.sendFile(`${mac}/${req.params.file}`)
    })

    fastify.get('/polycom/SoundPointIPLocalization/:dir/:file', async function (req, reply) {
        return reply.sendFile(`ucs/SoundPointIPLocalization/${req.params.dir}/${req.params.file}`)
    })

    fastify.get('/polycom/Config/:file', async function (req, reply) {
        return reply.sendFile(`ucs/Config/${req.params.file}`)
    })

    fastify.get('/polycom/languages/:file', async function (req, reply) {
        return reply.sendFile(`ucs/languages/${req.params.file}`)
    })

    fastify.put('/polycom/:file', async function (req, reply) {
        let mac = getMac(getName(req), this.xmlState.users)
        fs.writeFileSync(`${provpaths.polycom}/${mac}/${req.params.file}`, req.body)
        return 'OK'
    })
}

module.exports = polycomroutes