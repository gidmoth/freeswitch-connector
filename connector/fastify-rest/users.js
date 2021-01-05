/**
 * Endpoints for users functions
 */

const tar = require('tar-fs')
const fs = require('fs')
const FsOps = require('../apis/fsapi');
const fsDir = require('../config').getConfig('xmldir');
const Provpaths = require('../config').getConfig('provisioningpaths');
const statDir = Provpaths.all;

const storeDirectory = async (source, target) => {
    tar.pack(source).pipe(fs.createWriteStream(target, { emitClose: true })
    .on('error', (err) => {
        console.log(err)
    })
    .on('close', () => {
        console.log(`stored ${source} to ${target}`)
    }))
}

async function userroutes (fastify, options) {

    // schemas for validation
    const userAddSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'gidmoth/userAddSchema',
        body: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    password: { type: 'string' },
                    conpin: { type: 'string' },
                    context: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    polymac: { type: 'string' }
                },
                required: ['name', 'email', 'context'],
                additionalProperties: false
            }
        }
    }

    // get all users
    fastify.get('/api/users', async function (req, reply) {
        return this.xmlState.users
    })

    // add users
    fastify.post('/api/users/add', { schema: userAddSchema }, async function(req, reply) {
        FsOps.newUsers(this.xmlState, req.body)
        .then(newusers => {
            reply.send(newusers);
            storeDirectory(`${fsDir}/directory`, `${statDir}/store/directory.tar`)
        })
        .catch(error => {
            fastify.log.error(error)
            reply.send(`error: ${error}`)
        })
    })

    //rebuild  users
    fastify.get('/api/users/rebuild', async function (req, reply) {
        FsOps.rebUsers(this.xmlState)
        .then(rebuilt  => {
            reply.send(rebuilt)
        })
        .catch(error => {
            fastify.log.error(error)
            reply.send(`error: ${error}`)
        })

    })

    //reprovision  users
    fastify.get('/api/users/reprov', async function (req, reply) {
        FsOps.reprovUsers(this.xmlState)
        .then(reproved  => {
            reply.send(reproved)
        })
        .catch(error => {
            fastify.log.error(error)
            reply.send(`error: ${error}`)
        })

    })
}

module.exports = userroutes