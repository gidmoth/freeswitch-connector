/**
 * Endpoints for users functions
 */

const FsOps = require('../apis/fsapi');

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
        })
        .catch(error => {
            fastify.log.error(error)
            reply.send(`error: ${error}`)
        })
    })
}

module.exports = userroutes