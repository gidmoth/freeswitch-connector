/**
 * Endpoints for users functions
 */


const FsOps = require('../apis/fsapi');
const fsDir = require('../config').getConfig('xmldir');
const Provpaths = require('../config').getConfig('provisioningpaths');
const statDir = Provpaths.all;
const ConfCtxConf = require('../config.js').getConfig('contexts');
const Contexts = Object.keys(ConfCtxConf);
const storefunct = require('./storefunctions')


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
                storefunct.storeDirectory(`${fsDir}/directory`, `${statDir}/store/directory.tar.gz`)
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
                storefunct.storeDirectory(`${fsDir}/directory`, `${statDir}/store/directory.tar.gz`)
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
}

module.exports = userroutes