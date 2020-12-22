/**
 * Endpoints for users functions
 */

const FsOps = require('../apis/fsapi');

async function userroutes (fastify, options) {
    
    // get all users
    fastify.get('/api/users', async function (req, reply) {
        return this.xmlState.users
    })

    // add users
    fastify.post('/api/users/add', async function(req, reply) {
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