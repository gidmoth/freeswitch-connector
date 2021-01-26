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

const checkFile = (myopt) => {
    let file = path.normalize(myopt)
    if (!(fs.existsSync(file) || file == '')) {
        return false
    }
    return true
}


async function maitainroutes(fastify, options) {

    fastify.get('/api/restore/:dir', async function (req, reply) {
        let answer = { op: `restore/${req.params.dir}`, done: '', failed: '' }
        switch (req.params.dir) {
            case 'directory':
                if (checkFile(`${statDir}/store/directory.tar.gz`)) {
                    fs.rmdirSync(`${fsDir}/directory`, { recursive: true })
                    let writtendir = await storefuncts.reStoreDirectory(`${statDir}/store/directory.tar.gz`, `${fsDir}/directory`)
                    answer.done = writtendir
                } else {
                    answer.failed = `couldn't find ${statDir}/store/directory.tar.gz`
                }
                break;
            case 'dialplan':
                if (checkFile(`${statDir}/store/dialplan.tar.gz`)) {
                    fs.rmdirSync(`${fsDir}/dialplan`, { recursive: true })
                    let writtenplan = await storefuncts.reStoreDirectory(`${statDir}/store/dialplan.tar.gz`, `${fsDir}/dialplan`)
                    answer.done = writtenplan
                } else {
                    answer.failed = `couldn't find ${statDir}/store/dialplan.tar.gz`
                }
                break;
            case 'freeswitch':
                if (checkFile(`${statDir}/store/freeswitch.tar.gz`)) {
                    fs.rmdirSync(`${fsDir}`, { recursive: true })
                    let writtenswitch = await storefuncts.reStoreDirectory(`${statDir}/store/freeswitch.tar.gz`, `${fsDir}`)
                    answer.done = writtenswitch
                } else {
                    answer.failed = `couldn't find ${statDir}/store/freeswitch.tar.gz`
                }
                break;
            case 'conferences':
                if (checkFile(`${statDir}/store/conferences.tar.gz`)) {
                    fs.rmdirSync(`${fsDir}/dialplan/conferences`, { recursive: true })
                    let writtenconf = await storefuncts.reStoreDirectory(`${statDir}/store/conferences.tar.gz`, `${fsDir}/dialplan/conferences`)
                    answer.done = writtenconf
                } else {
                    answer.failed = `couldn't find ${statDir}/store/conferences.tar.gz`
                }
                break;
            default:
                answer.failed = `${req.params.dir} is not implementet`
                return answer
        }
        runReload(this.xmlState)
        return answer
    })

    fastify.get('/api/store/:dir', async function (req, reply) {
        let answer = { op: `store/${req.params.dir}`, done: '', failed: '' }
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
                answer.done = `${statDir}/store/conferences.tar.gz`
                break;
            default:
                answer.done = `${req.params.dir} is not implementet`
                break;
        }
        return answer
    })

    fastify.get('/api/info', async function (req, reply) {
        let answer = { op: 'info' }
        answer.info = this.xmlState.info
        answer.globals = this.xmlState.globals
        return answer
    })

    fastify.get('/api/info/state', async function (req, reply) {
        let answer = { op: 'info/state' }
        answer.state = this.xmlState
        return answer
    })
}

module.exports = maitainroutes