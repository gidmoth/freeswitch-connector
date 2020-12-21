/**
 * Entrypoint for all fastify api routes
 */

const fasticonf = require('../config').getConfig('fasti');

async function apiroutes (fastify, options) {
    // validation function
    function validate (username, password, req, reply, done) {
        if (fastify.xmlState.users.filter(usr => usr.name == username)[0].password == password) {
            done()
        } else {
            done(new Error('Winter is coming'))
        }
    }

    // realm for clientuse
    const authenticate = {realm: `${fasticonf.hostname}`}

    // decorate fastify with basic-auth
    fastify.register(require('fastify-basic-auth'), {validate, authenticate})
    
    // add requesthook after loading plugin
    fastify.after(() => {
        fastify.addHook('onRequest', fastify.basicAuth)

        // routes
        fastify.get('/api/users', (req, reply) => {
            reply.send(fastify.xmlState.users)
        })

    })
}

module.exports = apiroutes