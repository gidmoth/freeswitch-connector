#!/usr/bin/env node

/**
 * simple client to test freeswitch-connector
 */

const conf = require('./clientconf').getConfig('client')
const digfetch = require('digest-fetch')
const path = require('path')
const yargs = require('yargs')
const fs = require('fs')
const inquirer = require("inquirer")


const interActive = (argv) => {
    if (argv._[0] == 'addusers' && !argv.i && !argv.userarray) {
        argv.i = true
    }
    return {}
}

const argv = yargs
    .strict()
    .scriptName('')
    .usage('Usage: $0 <command> [options]')
    .command('users', 'show list of all users')
    .command('addusers [userarray]',
        'add users, takes json array of userobjects as arg',
        (yargs) => {
            return yargs.option('i', {
                alias: 'intac',
                type: 'boolean',
                describe: 'be interactive'
            })
                .option('f', {
                    alias: 'file',
                    describe: 'read userarray from file',
                    type: 'string',
                    nargs: 1
                })
        })
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
    .middleware(interActive)
    .argv;

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
    if (!(fs.existsSync(dir) || dir == '')) {
        return false
    }
    return true
}

const users = (text) => new Promise((resolve, reject) => {
    client.fetch(`${conf.baseurl}/users`)
        .then(resp => resp.text())
        .then(txt => {
            try {
                let data = JSON.parse(txt)
                if (text) {
                    let txtdata = ''
                    txtdata += `Called: ${conf.baseurl}/${data.op}` + '\n\n'
                    txtdata += `Total users: ${data.info.total}` + '\n'
                    txtdata += 'Users in contexts:\n'
                    for (let [key, value] of Object.entries(data.info.contexts)) {
                        txtdata += `    ${key}:  ${value}` + '\n'
                    }
                    txtdata += '\nUsers:\n-----\n'
                    for (let usr of data.users) {
                        txtdata += '\n' + `${usr.name}` + '\n'
                        txtdata += `    id:       ${usr.id}` + '\n'
                        txtdata += `    password: ${usr.password}` + '\n'
                        txtdata += `    conpin:   ${usr.conpin}` + '\n'
                        txtdata += `    context:  ${usr.context}` + '\n'
                        txtdata += `    name:     ${usr.name}` + '\n'
                        txtdata += `    email:    ${usr.email}` + '\n'
                        txtdata += `    polymac:  ${usr.polymac}` + '\n'
                    }
                    resolve(txtdata)
                }
                resolve(JSON.stringify(data))
            } catch (err) {
                let data = txt
                resolve(`ERROR: ${data}`)
            }
        })
        .catch(err => {
            console.log(err)
            reject(err)
        })
})

const addusers = (text, postbody) => new Promise((resolve, reject) => {
    client.fetch(`${conf.baseurl}/users/add`, getPostoptions(postbody))
        .then(resp => resp.text())
        .then(txt => {
            try {
                let data = JSON.parse(txt)
                if (text) {
                    let txtdata = ''
                    txtdata += `Called: ${conf.baseurl}/${data.op}` + '\n\n'
                    txtdata += 'Done:\n----\n'
                    if (data.done.length < 1) {
                        txtdata += '[]\n\n'
                    } else {
                        txtdata += '[\n'
                        for (let usr of data.done) {
                            txtdata += `  ${usr.name}` + '\n'
                            txtdata += `      id:       ${usr.id}` + '\n'
                            txtdata += `      password: ${usr.password}` + '\n'
                            txtdata += `      conpin:   ${usr.conpin}` + '\n'
                            txtdata += `      context:  ${usr.context}` + '\n'
                            txtdata += `      name:     ${usr.name}` + '\n'
                            txtdata += `      email:    ${usr.email}` + '\n'
                            txtdata += `      polymac:  ${usr.polymac}` + '\n'
                        }
                        txtdata += ']\n\n'
                    }
                    txtdata += 'Failed:\n------\n'
                    if (data.failed.length < 1) {
                        txtdata += '[]\n\n'
                    } else {
                        txtdata += '[\n'
                        for (let usr of data.failed) {
                            txtdata += `  ERROR: ${usr.error}` + '\n'
                            for (let [key, value] of Object.entries(usr.user)) {
                                txtdata += `    ${key}: ${value}` + '\n'
                            }
                        }
                        txtdata += ']\n'
                    }
                    resolve(txtdata)
                }
                resolve(JSON.stringify(data))
            } catch (err) {
                let data = txt
                resolve(`ERROR: ${data}`)
            }
        })
        .catch(err => {
            console.log(err)
            reject(err)
        })
})

const askAddUsers = () => {
    const questions = [
        {
            name: 'name',
            type: 'input',
            message: 'how is the user called?'
        },
        {
            name: 'context',
            type: 'input',
            message: 'which context should the user join?'
        },
        {
            name: 'email',
            type: 'input',
            message: 'what\'s the users email?'
        },
        {
            name: 'password',
            type: 'input',
            default: '',
            message: 'custom password?'
        },
        {
            name: 'conpin',
            type: 'input',
            default: '',
            message: 'custom conpin?'
        },
        {
            name: 'polymac',
            type: 'input',
            default: 'none',
            message: 'provision a polycom phone?'
        }
    ]
    return inquirer.prompt(questions)
}


async function runMe(argv) {
    if (argv.i) {
        switch (argv._[0]) {
            case 'addusers':
                let answers = await askAddUsers()
                argv.userarray = `[${JSON.stringify(answers)}]`
                break;
            default:
                console.log('i want to be interactive')
        }
    }
    switch (argv._[0]) {
        case 'users':
            if (argv.o) {
                if (!(checkPath(argv.o))) {
                    process.stdout.write(`ERROR: no path to ${argv.o}` + '\n')
                    return
                }
                users(argv.t)
                    .then(userlist => {
                        fs.writeFileSync(path.normalize(argv.o), userlist)
                        process.stdout.write(`written: ${path.normalize(argv.o)}` + '\n')
                        return
                    })
                    .catch(err => console.log(err))
            } else {
                users(argv.t)
                    .then(userlist => {
                        process.stdout.write(userlist)
                    })
                    .catch(err => console.log(err))
            }
            break;
        case 'addusers':
            let postbody = JSON.parse(argv.userarray)
            if (argv.o) {
                if (!(checkPath(argv.o))) {
                    process.stdout.write(`ERROR: no path to ${argv.o}` + '\n')
                    return
                }
                addusers(argv.t, postbody)
                    .then(answer => {
                        fs.writeFileSync(path.normalize(argv.o), answer)
                        process.stdout.write(`written: ${path.normalize(argv.o)}` + '\n')
                        return
                    })
                    .catch(err => console.log(err))
            } else {
                addusers(argv.t, postbody)
                    .then(answer => {
                        process.stdout.write(answer)
                    })
                    .catch(err => console.log(err))
            }
            break;
        default:
            ;
    }
}

runMe(argv)
//users(argv.t)
//console.log(argv)

//users()



