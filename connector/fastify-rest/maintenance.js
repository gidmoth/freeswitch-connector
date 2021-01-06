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
}

module.exports = maitainroutes