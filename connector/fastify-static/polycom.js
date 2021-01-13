/**
 * Endpoint for polycom provisioning
 */


const provpaths = require('../config').getConfig('provisioningpaths')
const fs = require('fs')

async function polycomroutes(fastify, options) {
    fastify.register(require('fastify-static'), {
        root: provpaths.polycom,
        prefix: '/polycom/',
        serve: false
    })

    fastify.addContentTypeParser('*', function (request, payload, done) {
        let buffer = []
        payload.on('error', (err) => {
            console.log(err)
            buffer = Buffer.concat(buffer).toString()
            done(null, buffer)
        }).on('data', chunk => {
            buffer.push(chunk)
        }).on('end', () => {
            buffer = Buffer.concat(buffer).toString()
            done(null, buffer)
        })
    })

    fastify.get('/polycom/:file', async function (req, reply) {
        if (req.params.file.endsWith('.ld') ||
            req.params.file.endsWith('.jpg') ||
            req.params.file.endsWith('.wav') ||
            req.params.file.endsWith('.ver')) {
            return reply.sendFile(`ucs/${req.params.file}`)
        }
        let mac = req.user.polymac
        return reply.sendFile(`${mac}/${req.params.file}`)
    })

    fastify.get('/polycom/SoundPointIPLocalization/:dir/:file', async function (req, reply) {
        return reply.sendFile(`ucs/SoundPointIPLocalization/${req.params.dir}/${req.params.file}`)
    })

    fastify.get('/polycom/Config/:file', async function (req, reply) {
        return reply.sendFile(`ucs/Config/${req.params.file}`)
    })

    fastify.get('/polycom/languages/:file', async function (req, reply) {
        return reply.sendFile(`ucs/languages/${req.params.file}`)
    })

    fastify.get('/polycom/:dir/000000000000-directory.xml', async function (req, reply) {
        return reply.sendFile(`${req.params.dir}/000000000000-directory.xml`)
    })

    fastify.put('/polycom/:file', async function (req, reply) {
        let mac = req.user.polymac
        if (req.params.file.endsWith('-app.log')) {
            fs.appendFileSync(`${provpaths.polycom}/${mac}/${req.params.file}`, req.body)
            return { 'appended': `${req.params.file}` }
        }
        fs.writeFileSync(`${provpaths.polycom}/${mac}/${req.params.file}`, req.body)
        return { 'written': `${req.params.file}` }
    })
}

module.exports = polycomroutes