/**
 * Endpoints for users functions
 */

async function userroutes (fastify, options) {
    
    // get all users
    fastify.get('/api/users', async function (req, reply) {
        return this.xmlState.users
    })
}

module.exports = userroutes