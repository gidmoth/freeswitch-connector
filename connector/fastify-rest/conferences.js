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
}

module.exports = confroutes