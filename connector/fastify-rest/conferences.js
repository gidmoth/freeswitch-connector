/**
 * Endpoints for users functions
 */


const FsOps = require('../apis/fsapi');
const ConfCtxConf = require('../config.js').getConfig('contexts');
const Contexts = Object.keys(ConfCtxConf);


async function confroutes(fastify, options) {

    // schemas for validation
    const confAddSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'gidmoth/confAddSchema',
        body: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    context: { type: 'string' },
                },
                required: ['type', 'context', 'name'],
                additionalProperties: false
            }
        }
    }

    const confDelSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'gidmoth/confDelSchema',
        body: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    num: { type: 'string' }
                },
                required: ['num'],
                additionalProperties: false
            }
        }
    }

    const confModSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'gidmoth/confAddSchema',
        body: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    num: { type: 'string' },
                    name: { type: 'string' },
                    type: { type: 'string' },
                    context: { type: 'string' },
                },
                required: ['num'],
                additionalProperties: false
            }
        }
    }


    // get all conferences
    fastify.get('/api/conferences', async function (req, reply) {
        function ctxNums(Contexts, confarray) {
            let retobj = {}
            Contexts.forEach(ctx => {
                retobj[ctx] = confarray.filter(conf => conf.context == ctx).length
            })
            return retobj
        }
        let conferences = {
            op: 'conferences',
            info: {
                total: this.xmlState.conferences.length,
                contexts: ctxNums(Contexts, this.xmlState.conferences),
                types: this.xmlState.conferencetypes
            },
            conferences: this.xmlState.conferences
        }
        return conferences
    })

    fastify.get('/api/conferences/bynum/:num', async function (req, reply) {
        let conferences = {
            op: `conferences/bynum/${req.params.num}`,
            conferences: this.xmlState.conferences.filter(cnf => cnf.num.startsWith(req.params.num))
        }
        return conferences
    })

    fastify.get('/api/conferences/byname/:name', async function (req, reply) {
        let conferences = {
            op: `conferences/byname/${req.params.name}`,
            conferences: this.xmlState.conferences.filter(cnf => cnf.name.startsWith(req.params.name))
        }
        return conferences
    })

    fastify.get('/api/conferences/bytype/:type', async function (req, reply) {
        let conferences = {
            op: `conferences/bytype/${req.params.type}`,
            conferences: this.xmlState.conferences.filter(cnf => cnf.type.startsWith(req.params.type))
        }
        return conferences
    })

    fastify.get('/api/conferences/bycontext/:ctx', async function (req, reply) {
        let conferences = {
            op: `conferences/bycontext/${req.params.ctx}`,
            conferences: this.xmlState.conferences.filter(cnf => cnf.context.startsWith(req.params.ctx))
        }
        return conferences
    })

    // rebuild contacts lists
    fastify.get('/api/conferences/rebuildcontacts', async function (req, reply) {
        FsOps.rebuildContacts(this.xmlState)
            .then(recon => {
                reply.send(recon);
            })
            .catch(error => {
                fastify.log.error(error)
                reply.send(`error: ${error}`)
            })
    })

    // add conferences
    fastify.post('/api/conferences/add', { schema: confAddSchema }, async function (req, reply) {
        FsOps.newConfs(this.xmlState, req.body)
            .then(newconfs => {
                reply.send(newconfs);
            })
            .catch(error => {
                fastify.log.error(error)
                reply.send(`error: ${error}`)
            })
    })

    // delete conferences
    fastify.post('/api/conferences/del', { schema: confDelSchema }, async function (req, reply) {
        FsOps.delConfs(this.xmlState, req.body)
            .then(delconfs => {
                reply.send(delconfs);
            })
            .catch(error => {
                fastify.log.error(error)
                reply.send(`error: ${error}`)
            })
    })

    // modify conferences
    fastify.post('/api/conferences/mod', { schema: confModSchema }, async function (req, reply) {
        FsOps.modConfs(this.xmlState, req.body)
            .then(modconfs => {
                reply.send(modconfs);
            })
            .catch(error => {
                fastify.log.error(error)
                reply.send(`error: ${error}`)
            })
    })
}

module.exports = confroutes