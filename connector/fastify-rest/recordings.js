/**
 * Static routes for accessing recordings
 */

const fsConf = require('../config').getConfig('freeswitch')
const fs = require('fs')

async function recordingsroutes(fastify, options) {
    fastify.register(require('fastify-static'), {
        root: fsConf.recordings,
        prefix: '/api/recordings/',
        serve: false
    })

    fastify.get('/api/recordings/:file', async function (req, reply) {
        return reply.sendFile(`${req.params.file}`)
    })

    fastify.get('/api/recordings', async function (req, reply) {
        let answer = { op: 'api/recordings', files: [] }
        fs.readdirSync(fsConf.recordings).forEach(file => {
            answer.files.push(file)            
        });
        return  answer
    })

}

exports.recordingsroutes = recordingsroutes