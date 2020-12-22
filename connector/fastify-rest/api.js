/**
 * Entrypoint for all fastify api routes
 */

const fasticonf = require('../config').getConfig('fasti');

async function apiroutes (fastify, options) {

    // utility for getting user
    function getMyUser(array, name, done) {
        return array.filter(usr => usr.name == name)[0]
    }

    // validation function
    function validate (username, password, req, reply, done) {
        let usr = getMyUser(fastify.xmlState.users, username);
        if (usr == undefined) {
            done(new Error('User not found'))
        }
        if (usr.password == password && usr.context == fasticonf.apiallow) {
            done()
        } else {
            done(new Error('Wrong Pass or Usercontext'))
        }
    }

    // realm for clientuse
    const authenticate = {realm: `${fasticonf.hostname}`}

    // decorate fastify with basic-auth
    fastify.register(require('fastify-basic-auth'), {validate, authenticate})
    
    // add requesthook after loading plugin
    fastify.after(() => {
        fastify.addHook('onRequest', fastify.basicAuth)

        // load users endpoints
        fastify.register(require('./users'))
    })
}

module.exports = apiroutes