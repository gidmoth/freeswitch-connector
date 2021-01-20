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

    // Schema
    const recDelSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'gidmoth/recDelSchema',
        body: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    file: { type: 'string' }
                },
                required: ['file'],
                additionalProperties: false
            }
        }
    }

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

    fastify.post('/api/recordings/del', { schema: recDelSchema }, async function (req, reply) {
        let answer = { op: 'api/recordings/del', done: [], failed: [] }
        req.body.forEach(file =>  {
            try {
                fs.unlinkSync(`${fsConf.recordings}/${file.file}`)
                answer.done.push(file.file)
            } catch (error) {
                answer.failed.push(file.file)       
            }
        })
        return answer
    })
}

module.exports = recordingsroutes