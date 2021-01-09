#!/usr/bin/env node

/**
 * simple client to test freeswitch-connector
 */

const conf = require('./clientconf').getConfig('client')
const digfetch = require('digest-fetch')
const path = require('path')
const yargs = require('yargs')
const fs = require('fs')

const argv = yargs
    .strict()
    .usage('Usage: $0 <command> [options]')
    .command('users [-t, -o <file>]', 'show a list of users')
    .option('o', {
        nargs: 1,
        type: 'string',
        describe: 'output to named file',
        alias: 'out'
    })
    .option('t', {
        type: 'boolean',
        describe: 'output text instead of json',
        default: false,
        alias: 'text'
    })
    .help()
    .alias('help', 'h')
    .alias('version', 'v')
    .demandCommand(1, 1, 'You need a command', 'I can\'t handle more than one commands')
    .argv;

switch (argv._[0]) {
    case 'users':
        async () => {
            if (argv.o) {
                if (!(checkPath(argv.o))) {
                    return `ERROR: no path to ${argv.o}`
                }
                let userlist = await users(argv.t)
                fs.writeFileSync(path.normalize(argv.o), userlist)
                return `written: ${path.normalize(argv.o)}`
            } else {
                let userlist = await users(argv.t)
                process.stdout.write(userlist)
            }
        }
        break;
    default:
        ;
}


const client = new digfetch(conf.user, conf.pw)

const getPostoptions = (body) => {
    return {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    }
}

const checkPath = (myopt) => {
    let dir = path.parse(path.normalize(myopt)).dir
    if ( !(fs.existsSync(dir) || dir == '')) {
        return false
    }
    return true
}

const users = (text) => {
    client.fetch(`${conf.baseurl}/users`)
        .then(resp => resp.text())
        .then(txt => {
            try {
                let data = JSON.parse(txt)
                if  (text) {
                    let txtdata = ''
                    txtdata += `Called: ${conf.baseurl}/${data.op}` + '\n'
                    txtdata += `Total users: ${data.info.total}` + '\n'
                    txtdata += 'Users in contexts:\n'
                    for (let [key, value] of Object.entries(data.info.contexts)) {
                        txtdata += `    ${key}:  ${value}` + '\n'
                    }
                    txtdata += 'Users:\n-----\n'
                    for (let usr of data.users) {
                        txtdata += `${usr.name}` + '\n'
                        txtdata += `    id:       ${usr.id}` + '\n'
                        txtdata += `    password: ${usr.password}` + '\n'
                        txtdata += `    conpin:   ${usr.conpin}` + '\n'
                        txtdata += `    context:  ${usr.context}` + '\n'
                        txtdata += `    name:     ${usr.name}` + '\n'
                        txtdata += `    email:    ${usr.email}` + '\n'
                        txtdata += `    polymac:  ${usr.polymac}` + '\n'
                    }
                    return txtdata
                }
                return JSON.stringify(data)
            } catch (err) {
                let data = txt
                return `ERROR: ${data}`
            }
        })
        .catch(err => {
            console.log(err)
        })
}

//console.log(argv)

//users()



