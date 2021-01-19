/**
 * main Script
 */

const fasticonf = require('./config').getConfig('fasti');
const Monitor = require('./fseventconsumers/esmonitor.js');
// the state will be the same objectinstance for the whole runtime
const xmlState = {};
const liveState = {};
const maintain = require('./maintainance');
const fs = require('fs');

xmlState.info = {
    reloadxml: {
        lastrun: 'not till now',
        lastmsg: 'no Message'
    },
    maintainance: {
        lastrun: 'not till now'
    }
}

liveState.recstates = {}

// start monitoring fsevents, xmlState is needed for reacting on
// certain events.
Monitor.startMon(xmlState, liveState);

// init/fill xmlState.
maintain.updateXmlState(xmlState);

// init fastify for rest and static interface
const fastify = require ('fastify')({
    logger: true,
    https: {
        key: fs.readFileSync(fasticonf.key),
        cert: fs.readFileSync(fasticonf.cert)
    }   
})

// pass xmlState to fastify instance
fastify.decorate('xmlState', xmlState)

// register api endpionts
fastify.register(require('./fastify-rest/api'))

// register static endpoints
fastify.register(require('./fastify-static/static'))


// start fastify
fastify.listen(fasticonf.port, fasticonf.ip, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})


