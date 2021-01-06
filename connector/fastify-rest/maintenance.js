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

    fastify.get('/api/restore/:dir', async function (req, reply) {
        let answer = { op: `restore/${req.params.dir}`, done: '' }
        switch (req.params.dir) {
            case 'directory':
                let writtendir = await storefuncts.reStoreDirectory(`${statDir}/store/directory.tar.gz`, `${fsDir}/directory`)
                answer.done = writtendir
                break;
            case 'dialplan':
                let writtenplan = await storefuncts.reStoreDirectory(`${statDir}/store/dialplan.tar.gz`, `${fsDir}/dialplan`)
                answer.done = writtenplan
                break;
            case 'freeswitch':
                let writtenswitch = await storefuncts.reStoreDirectory(`${statDir}/store/freeswitch.tar.gz`, `${fsDir}`)
                answer.done = writtenswitch
                break;
            case 'conferences':
                let writtenconf = await storefuncts.reStoreDirectory(`${statDir}/store/conferences.tar.gz`, `${fsDir}/dialplan/conferences`)
                answer.done = writtenconf
                break;
            default:
                answer.done = `${req.params.dir} is not implementet`
                return answer
        }
        runReload(this.xmlState)
        return answer
    })

    fastify.get('/api/store/:dir', async function (req, reply) {
        let answer = { op: `store/${req.params.dir}`, done: '' }
        switch (req.params.dir) {
            case 'directory':
                storefuncts.storeDirectory(`${fsDir}/directory`, `${statDir}/store/directory.tar.gz`)
                answer.done = `${statDir}/store/directory.tar.gz`
                break;
            case 'dialplan':
                storefuncts.storeDirectory(`${fsDir}/dialplan`, `${statDir}/store/dialplan.tar.gz`)
                answer.done = `${statDir}/store/dialplan.tar.gz`
                break;
            case 'freeswitch':
                storefuncts.storeDirectory(`${fsDir}`, `${statDir}/store/freeswitch.tar.gz`)
                answer.done = `${statDir}/store/freeswitch.tar.gz`
                break;
            case 'conferences':
                storefuncts.storeDirectory(`${fsDir}/dialplan/conferences`, `${statDir}/store/conferences.tar.gz`)
                answer.done = written
                break;
            default:
                answer.done = `${req.params.dir} is not implementet`
                break;
        }
        return answer
    })
}

module.exports = maitainroutes