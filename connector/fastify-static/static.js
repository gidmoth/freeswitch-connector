/**
 * Entrypoint for all fastify static routes
 */

const fasticonf = require('../config').getConfig('fasti');
const provpaths = require('../config').getConfig('provisioningpaths')

async function staticroutes (fastify, options) {

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
        if (usr.password == password) {
            done()
        } else {
            done(new Error('Wrong Pass'))
        }
    }

    // realm for clientuse
    const authenticate = {realm: `${fasticonf.hostname}`}

    // decorate fastify with basic-auth
    fastify.register(require('fastify-basic-auth'), {validate, authenticate})
    
    // add requesthook after loading plugin
    fastify.after(() => {
        fastify.addHook('onRequest', fastify.basicAuth)

        // load provisioning endpoints
        fastify.register(require('./polycom'))
    })
}

module.exports = staticroutes