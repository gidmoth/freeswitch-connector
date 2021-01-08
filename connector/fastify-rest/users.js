/**
 * Endpoints for users functions
 */


const FsOps = require('../apis/fsapi');
const ConfCtxConf = require('../config.js').getConfig('contexts');
const Contexts = Object.keys(ConfCtxConf);


async function userroutes(fastify, options) {

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

    const userDelSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'gidmoth/userDelSchema',
        body: {
            type: 'array',
            items: {
                type: 'string'
            }
        }
    }

    const userModSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'gidmoth/userModSchema',
        body: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    password: { type: 'string' },
                    conpin: { type: 'string' },
                    context: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    polymac: { type: 'string' }
                },
                required: ['id'],
                additionalProperties: false
            }
        }
    }

    // get all users
    fastify.get('/api/users', async function (req, reply) {
        function ctxNums(Contexts, usrarray) {
            let retobj = {}
            Contexts.forEach(ctx => {
                retobj[ctx] = usrarray.filter(usr => usr.context == ctx).length
            })
            return retobj
        }
        let users = {
            op: 'users',
            info: {
                total: this.xmlState.users.length,
                contexts: ctxNums(Contexts, this.xmlState.users) 
            },
            users: this.xmlState.users
        }
        return users
    })

    // add users
    fastify.post('/api/users/add', { schema: userAddSchema }, async function (req, reply) {
        FsOps.newUsers(this.xmlState, req.body)
            .then(newusers => {
                reply.send(newusers);
            })
            .catch(error => {
                fastify.log.error(error)
                reply.send(`error: ${error}`)
            })
    })

    //rebuild  users
    fastify.get('/api/users/rebuild', async function (req, reply) {
        FsOps.rebUsers(this.xmlState)
            .then(rebuilt => {
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
            .then(reproved => {
                reply.send(reproved)
            })
            .catch(error => {
                fastify.log.error(error)
                reply.send(`error: ${error}`)
            })

    })

    // delete users
    fastify.post('/api/users/del', { schema: userDelSchema }, async function (req, reply) {
        FsOps.delUsers(this.xmlState, req.body)
            .then(deletet => {
                reply.send(deletet);
            })
            .catch(error => {
                fastify.log.error(error)
                reply.send(`error: ${error}`)
            })
    })

    // modify users
    fastify.post('/api/users/mod', { schema: userModSchema }, async function (req, reply) {
        FsOps.modUsers(this.xmlState, req.body)
            .then(modified => {
                reply.send(modified);
            })
            .catch(error => {
                fastify.log.error(error)
                reply.send(`error: ${error}`)
            })
    })
}

module.exports = userroutes