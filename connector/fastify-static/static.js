/**
 * Entrypoint for all fastify static routes
 */

const { default: passport } = require('fastify-passport');
const fasticonf = require('../config').getConfig('fasti');
const secSession = require('fastify-secure-session');
const ppHttp = require('passport-http')

async function staticroutes(fastify, options) {

    // utility for getting user
    function getMyUser(array, name) {
        return array.filter(usr => usr.name == name)[0]
    }

    // decorate fastify with passport-plugin
    passport.use('digest', new ppHttp.DigestStrategy({ qop: 'auth' },
        function (username, done) {
            let usr = getMyUser(fastify.xmlState.users, username);
            if (usr == undefined) {
                return done(null, false)
            }
            return done(null, usr, usr.password)
        }
    ))
    fastify.register(secSession, { key: 'foobarbaz' })
    fastify.register(passport.initialize())
    fastify.register(passport.secureSession())

    fastify.after(() => {
        fastify.addHook('onRequest', passport.authenticate("digest", { session: false }))
        // load provisioning endpoints
        fastify.register(require('./polycom'))
        fastify.register(require('./linphone'))
    })
}

module.exports = staticroutes