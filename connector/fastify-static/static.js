/**
 * Entrypoint for all fastify static routes
 */

const { default: passport } = require('fastify-passport');
const statpaths = require('../config').getConfig('provisioningpaths');
const fs = require('fs');
const secSession = require('fastify-secure-session');
const ppHttp = require('passport-http')

async function staticroutes(fastify, options) {

    // utility for getting user
    function getMyUser(array, name) {
        return array.filter(usr => usr.name == name)[0]
    }

    // decorate fastify with passport-plugin
    passport.use('digestall', new ppHttp.DigestStrategy({ qop: 'auth' },
        function (username, done) {
            let usr = getMyUser(fastify.xmlState.users, username);
            if (usr == undefined) {
                return done(null, false)
            }
            return done(null, usr, usr.password)
        }
    ))

    // register authmech
    fastify.register(secSession, { key: fs.readFileSync(`${statpaths.all}/secrets/secret-key`) })
    fastify.register(passport.initialize())
    fastify.register(passport.secureSession())

    // add authhook
    fastify.after(() => {
        fastify.addHook('onRequest', passport.authenticate("digest", { session: false }))
        // load provisioning endpoints
        fastify.register(require('./polycom'))
        fastify.register(require('./linphone'))
    })
}

module.exports = staticroutes