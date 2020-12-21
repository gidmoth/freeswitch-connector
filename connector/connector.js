/**
 * main Script
 */

const fasticonf = require('./config').getConfig('fasti');
const Monitor = require('./fseventconsumers/esmonitor.js');
// the state will be the same objectinstance for the whole runtime
const xmlState = {};
const maintain = require('./maintainance');

// start monitoring fsevents, xmlState is needed for reacting on
// certain events.
Monitor.startMon(xmlState);

// init/fill xmlState.
maintain.updateXmlState(xmlState);

// init fastify for rest and static interface
const fastify = require ('fastify')({
    logger: true
})

// pass xmlState to fastify instance
fastify.decorate('xmlState', xmlState)

fastify.register(require('./fastify-rest/api'))



fastify.get('/', function (request, reply) {
    reply.send(this.xmlState.users)
})





// start fastify
fastify.listen(fasticonf.port, fasticonf.ip, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})


