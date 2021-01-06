/**
 * Functions to maintain th system
 */

const storefuncts = require('./storefunctions')
const fsDir = require('../config').getConfig('xmldir');
const Provpaths = require('../config').getConfig('provisioningpaths');
const statDir = Provpaths.all;

async function maitainroutes(fastify, options) {

    fastify.get('/api/restore/directory', async function (req, reply) {
        let answer = { op: 'restore/directory', done: '' }
        await storefuncts.reStoreDirectory(`${statDir}/store/directory.tar.gz`, `${fsDir}/directory`, this.xmlState)
        answer.done = 'OK'
        return answer
    })

}

module.exports = maitainroutes