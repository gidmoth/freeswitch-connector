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
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id'],
                additionalProperties: false
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

    // get users by id
    fastify.get('/api/users/byid/:userid', async function (req, reply) {
        let users = {
            op: `users/byid/${req.params.userid}`,
            users: this.xmlState.users.filter(usr => usr.id.startsWith(req.params.userid))
        }
        return users
    })

    // get users by name
    fastify.get('/api/users/byname/:username', async function (req, reply) {
        let users = {
            op: `users/byname/${req.params.username}`,
            users: this.xmlState.users.filter(usr => usr.name.startsWith(req.params.username))
        }
        return users
    })

    // get users by context
    fastify.get('/api/users/bycontext/:userctx', async function (req, reply) {
        let users = {
            op: `users/bycontext/${req.params.userctx}`,
            users: this.xmlState.users.filter(usr => usr.context.startsWith(req.params.userctx))
        }
        return users
    })

    // get users by polymac
    fastify.get('/api/users/bypolymac/:userpmac', async function (req, reply) {
        let users = {
            op: `users/bypolymac/${req.params.userpmac}`,
            users: this.xmlState.users.filter(usr => usr.polymac.startsWith(req.params.userpmac))
        }
        return users
    })

    // match in users email
    fastify.get('/api/users/byemail/:usermail', async function (req, reply) {
        let users = {
            op: `users/byemail/${req.params.usermail}`,
            users: this.xmlState.users.filter(usr => usr.email.includes(req.params.usermail))
        }
        return users
    })

    // match mail or name
    fastify.get('/api/users/match/:matchstring', async function (req, reply) {
        let users = {
            op: `users/match/${req.params.matchstring}`,
            namematches: this.xmlState.users.filter(usr => usr.name.includes(req.params.matchstring)),
            emailmatches: this.xmlState.users.filter(usr => usr.email.includes(req.params.matchstring))
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
        let list = req.body.map(usr => usr.id)
        FsOps.delUsers(this.xmlState, list)
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