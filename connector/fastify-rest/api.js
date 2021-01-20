/**
 * Entrypoint for all fastify api routes
 */

const fasticonf = require('../config').getConfig('fasti');
const { default: passport } = require('fastify-passport');
const statpaths = require('../config').getConfig('provisioningpaths');
const fs = require('fs');
const secSession = require('fastify-secure-session');
const ppHttp = require('passport-http')

async function apiroutes (fastify, options) {

    // utility for getting user
    function getMyUser(array, name, done) {
        return array.filter(usr => usr.name == name)[0]
    }

    // decorate fastify with passport-plugin
    passport.use('digestapi', new ppHttp.DigestStrategy({ qop: 'auth' },
        function (username, done) {
            let usr = getMyUser(fastify.xmlState.users, username);
            if (usr == undefined || usr.context !== fasticonf.apiallow) {
                return done(null, false)
            }
            return done(null, usr, usr.password)
        }
    ))

    // register authmech
    fastify.register(secSession, { key: fs.readFileSync(`${statpaths.all}/secrets/secret-key`) })
    fastify.register(passport.initialize())
    fastify.register(passport.secureSession())

    // add requesthook after loading plugin
    fastify.after(() => {
        fastify.addHook('onRequest', passport.authenticate('digestapi', { session: false }))
        // load users endpoints
        fastify.register(require('./users'))
        // load maintenance endpoints
        fastify.register(require('./maintenance'))
        // load conference endpoints
        fastify.register(require('./conferences'))
        // recordings endpoints
        fastify.register(require('./recordings'))
    })
}

module.exports = apiroutes