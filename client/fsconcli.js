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


const stdinRead = () => new Promise((resolve, reject) => {
    let retval = '';
    process.stdin.on('data', (chunk) => {
        retval += chunk;
    })
    process.stdin.on('end', () => {
        resolve(retval)
    })
})

const fileRead = (file) => new Promise((resolve, reject) => {
    let retval = '';
    let mystream = fs.createReadStream(file)
    mystream.on('data', (chunk) => {
        retval += chunk;
    })
    mystream.on('end', () => {
        resolve(retval)
    })
})

const argv = yargs
    .strict()
    .scriptName('fsconcli')
    .usage('Usage: $0 <command> [options]')
    .command('users',
        'Show list of users, by default shows all users. Use \'users -h\' for a list of options.',
        (yargs) => {
            return yargs.option('id', {
                describe: 'Narrow list by user id.',
                type: 'string',
                nargs: 1
            }).option('name', {
                describe: 'Narrow list by user name.',
                type: 'string',
                nargs: 1
            }).option('context', {
                describe: 'Narrow list by user context.',
                type: 'string',
                nargs: 1
            }).option('polymac', {
                describe: 'Narrow list by users polyphone mac.',
                type: 'string',
                nargs: 1
            }).option('email', {
                describe: 'Narrow list by string matched to users emails.',
                type: 'string',
                nargs: 1
            }).option('match', {
                describe: 'Narrow list by matching string to emails and names.',
                type: 'string',
                nargs: 1
            })
        })
    .command('addusers [userarray]',
        'Add users, takes json array of userobjects as arg.',
        (yargs) => {
            return yargs.option('f', {
                alias: 'file',
                describe: 'Read userarray from file.',
                type: 'string',
                nargs: 1
            })
        })
    .option('i', {
        alias: 'intac',
        type: 'boolean',
        describe: 'Be interactive.',
        default: false
    })
    .option('o', {
        nargs: 1,
        type: 'string',
        describe: 'Output to named file.',
        alias: 'out'
    })
    .option('t', {
        type: 'boolean',
        describe: 'Output text instead of json.',
        default: false,
        alias: 'text'
    })
    .help()
    .alias('help', 'h')
    .alias('version', 'v')
    .demandCommand(1, 1, 'You need a command.', 'I can\'t handle more than 1 command')
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

const checkFile = (myopt) => {
    let file = path.normalize(myopt)
    console.log(`thats checked: ${file}`)
    if (!(fs.existsSync(file) || file == '')) {
        return false
    }
    return true
}

const retTextUser = (usr) => {
    let text = ''
    text += `  ${usr.name}` + '\n'
    text += `      id:       ${usr.id}` + '\n'
    text += `      password: ${usr.password}` + '\n'
    text += `      conpin:   ${usr.conpin}` + '\n'
    text += `      context:  ${usr.context}` + '\n'
    text += `      name:     ${usr.name}` + '\n'
    text += `      email:    ${usr.email}` + '\n'
    text += `      polymac:  ${usr.polymac}` + '\n'
    return text
}

const users = (argv) => new Promise((resolve, reject) => {
    let userreq = '/users'
    switch (true) {
        case argv.hasOwnProperty('id'):
            userreq += `/byid/${argv.id}`
            break;
        case argv.hasOwnProperty('name'):
            userreq += `/byname/${argv.name}`
            break;
        case argv.hasOwnProperty('context'):
            userreq += `/bycontext/${argv.context}`
            break;
        case argv.hasOwnProperty('polymac'):
            userreq += `/bypolymac/${argv.polymac}`
            break;
        case argv.hasOwnProperty('email'):
            userreq += `/byemail/${argv.email}`
            break;
        case argv.hasOwnProperty('match'):
            userreq += `/match/${argv.match}`
            break;
        default:
            ;
    }
    client.fetch(`${conf.baseurl}${userreq}`)
        .then(resp => resp.text())
        .then(txt => {
            try {
                let data = JSON.parse(txt)
                if (argv.t) {
                    let txtdata = ''
                    txtdata += `Called: ${conf.baseurl}/${data.op}` + '\n\n'
                    if (!data.op.includes('/')) {
                        txtdata += `Total users: ${data.info.total}` + '\n'
                        txtdata += 'Users in contexts:\n'
                        for (let [key, value] of Object.entries(data.info.contexts)) {
                            txtdata += `    ${key}:  ${value}` + '\n'
                        }
                    }
                    if (data.op.includes('match')) {
                        txtdata += 'Namematches:\n-----------\n'
                        if (data.namematches.length < 1) {
                            txtdata += '[]\n\n'
                        } else {
                            txtdata += '[\n'
                            for (let usr of data.namematches) {
                                txtdata += retTextUser(usr)
                            }
                            txtdata += ']\n\n'
                        }
                        txtdata += 'Emailmatches:\n------\n'
                        if (data.emailmatches.length < 1) {
                            txtdata += '[]\n\n'
                        } else {
                            txtdata += '[\n'
                            for (let usr of data.emailmatches) {
                                txtdata += retTextUser(usr)
                            }
                            txtdata += ']\n'
                        }
                    } else {
                        txtdata += '\nUsers:\n-----\n'
                        for (let usr of data.users) {
                            txtdata += retTextUser(usr)
                        }
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
                            txtdata += retTextUser(usr)
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

const askAddUsers = async (usrarr = []) => {
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
        },
        {
            name: 'again',
            type: 'confirm',
            message: 'enter another user?',
            default: false
        }
    ]

    let { again, ...answers } = await inquirer.prompt(questions)
    let newusers = [...usrarr, answers]
    return again ? askAddUsers(newusers) : newusers
}

const askUsers = async () => {
    const questions = [
        {
            name: 'userfilter',
            type: 'list',
            message: 'choose userfilter',
            choices: ['all', 'id', 'name', 'context', 'polymac', 'email', 'match'],
            default: 'all'
        },
        {
            name: 'matchstring',
            type: 'input',
            message: 'enter matchstring:',
            when: (choice) => choice.userfilter != 'all'
        }
    ]
    let answers = await inquirer.prompt(questions)
    return answers
}

async function runMe(argv) {
    if (argv.i) {
        switch (argv._[0]) {
            case 'addusers':
                let answers = await askAddUsers()
                argv.userarray = JSON.stringify(answers)
                break;
            case 'users':
                let uanswers = await askUsers()
                if (uanswers.userfilter != 'all') {
                    argv[uanswers.userfilter] = uanswers.matchstring
                }
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
                users(argv)
                    .then(userlist => {
                        fs.writeFileSync(path.normalize(argv.o), userlist)
                        process.stdout.write(`written: ${path.normalize(argv.o)}` + '\n')
                        return
                    })
                    .catch(err => console.log(err))
            } else {
                users(argv)
                    .then(userlist => {
                        process.stdout.write(userlist)
                    })
                    .catch(err => console.log(err))
            }
            break;
        case 'addusers':
            if (!process.stdin.isTTY && !argv.f && !argv.i) {
                try {
                    argv.userarray = await stdinRead()
                } catch (err) {
                    console.log(err)
                    return
                }
            }
            if (process.stdin.isTTY && !argv.f && !argv.i && !argv.userarray) {
                process.stdout.write(`The ${argv._[0]} command needs an userarray.` + '\n')
                process.stdout.write(`You can provide it as JSON by either means:` + '\n\n')
                process.stdout.write(`  - interactive, use the -i flag` + '\n')
                process.stdout.write(`  - pipe to stdin` + '\n')
                process.stdout.write(`  - read from file, use the -f flag` + '\n')
                process.stdout.write(`  - as argument on invocation` + '\n\n')
                process.stdout.write(`For format information see here:` + '\n')
                process.stdout.write(`https://github.com/gidmoth/freeswitch-connector#post-apiusersadd` + '\n')
                return
            }
            if (argv.f) {
                if (!(checkFile(argv.f))) {
                    process.stdout.write(`ERROR: can't find ${argv.f}` + '\n')
                    return
                } else {
                    try {
                        argv.userarray = await fileRead(path.normalize(argv.f))
                    } catch (err) {
                        console.log(err)
                        return
                    }
                }
            }
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



