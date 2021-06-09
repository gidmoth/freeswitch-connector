/**
 * main Script
 */

const fasticonf = require('./config').getConfig('fasti');
const Monitor = require('./fseventconsumers/esmonitor.js');
// the state will be the same objectinstance for the whole runtime
// const xmlState = {};
const liveConst = require('./livestate')
const liveState = new liveConst
const xmlState = new liveConst
const maintain = require('./maintainance');
const fs = require('fs');
const liveInit = require('./fseventusers/initlivestate')
//const heapdump = require('./HeapDump')

xmlState.info = {
    reloadxml: {
        lastrun: 'not till now',
        lastmsg: 'no Message'
    },
    maintainance: {
        lastrun: 'not till now'
    }
}

liveState.conferences = []
liveState.registrations = []
liveState.on('newListener', () => {
    console.log('got new listener')
})
liveState.on('removeListener', () => {
    console.log('removed listener')
})

// start heapdumper for leakchecks
//heapdump.init('/dumps')

// start monitoring fsevents, xmlState is needed for reacting on
// certain events.
Monitor.startMon(xmlState, liveState);

// init/fill xmlState.
maintain.updateXmlState(xmlState);

// init livestate
liveInit.run(liveState)
liveInit.runreg(liveState)

// init fastify for rest and static interface
const fastify = require('fastify')({
    logger: true,
    https: {
        key: fs.readFileSync(fasticonf.key),
        cert: fs.readFileSync(fasticonf.cert)
    }
})

// pass xmlState to fastify instance
fastify.decorate('xmlState', xmlState)

// pass liveState to fastify instance
fastify.decorate('liveState', liveState)

// cors for local frontend dev -- remove if not needed
fastify.register(require('fastify-cors'), {
    origin: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
})

// register api endpionts
fastify.register(require('./fastify-rest/api'))

// register static endpoints
fastify.register(require('./fastify-static/static'))

// register live endpoint
fastify.register(require('./fastify-socket/livePoint'))


// start fastify
fastify.listen(fasticonf.port, fasticonf.ip, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})
