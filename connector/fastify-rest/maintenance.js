/**
 * Functions to maintain th system
 */

const storefuncts = require('./storefunctions')
const fsDir = require('../config').getConfig('xmldir');
const Provpaths = require('../config').getConfig('provisioningpaths');
const statDir = Provpaths.all;
const reloadxml = require('../fseventusers/reloadxml')

//helper
const runReload = async (xmlState) => {
    reloadxml.run(xmlState)
        .then(msg => {
            return msg
        })
        .catch(err => {
            console.log(err)
            return err
        });
}


async function maitainroutes(fastify, options) {

    fastify.get('/api/restore/directory', async function (req, reply) {
        let answer = { op: 'restore/directory', done: '' }
        let written = await storefuncts.reStoreDirectory(`${statDir}/store/directory.tar.gz`, `${fsDir}/directory`)
        answer.done = written
        runReload(this.xmlState)
        return answer
    })

    fastify.get('/api/restore/dialplan', async function (req, reply) {
        let answer = { op: 'restore/dialplan', done: '' }
        let written = await storefuncts.reStoreDirectory(`${statDir}/store/dialplan.tar.gz`, `${fsDir}/dialplan`)
        answer.done = written
        runReload(this.xmlState)
        return answer
    })

    fastify.get('/api/restore/freeswitch', async function (req, reply) {
        let answer = { op: 'restore/freeswitch', done: '' }
        let written = await storefuncts.reStoreDirectory(`${statDir}/store/freeswitch.tar.gz`, `${fsDir}`)
        answer.done = written
        runReload(this.xmlState)
        return answer
    })

    fastify.get('/api/store/directory', async function (req, reply) {
        storefuncts.storeDirectory(`${fsDir}/directory`, `${statDir}/store/directory.tar.gz`)
        return { op: 'store/directory', done: `${statDir}/store/directory.tar.gz` }
    })

    fastify.get('/api/store/dialplan', async function (req, reply) {
        storefuncts.storeDirectory(`${fsDir}/dialplan`, `${statDir}/store/dialplan.tar.gz`)
        return { op: 'store/directory', done: `${statDir}/store/dialplan.tar.gz` }
    })

    fastify.get('/api/store/freeswitch', async function (req, reply) {
        storefuncts.storeDirectory(`${fsDir}`, `${statDir}/store/freeswitch.tar.gz`)
        return { op: 'store/directory', done: `${statDir}/store/freeswitch.tar.gz` }
    })
}

module.exports = maitainroutes