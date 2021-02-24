#!/usr/bin/env node

/**
 * simple client to test freeswitch-connector
 */

let conf = {}
const digfetch = require('digest-fetch')
const path = require('path')
const yargs = require('yargs')
const fs = require('fs')
const os = require('os')
const inquirer = require("inquirer")

const checkPath = (myopt) => {
    let dir = path.parse(path.normalize(myopt)).dir
    if (!(fs.existsSync(dir) || dir == '')) {
        return false
    }
    return true
}

const checkFile = (myopt) => {
    let file = path.normalize(myopt)
    if (!(fs.existsSync(file) || file == '')) {
        return false
    }
    return true
}

const askConf = async () => {
    const questions = [
        {
            name: 'url',
            type: 'input',
            message: 'Enter api url:',
            default: 'https://host.example.com/api'
        },
        {
            name: 'uname',
            type: 'input',
            message: 'Enter username:',
            default: 'fooname'
        },
        {
            name: 'pw',
            type: 'input',
            message: 'Enter password:',
            default: 'barpass'
        }
    ]
    let answers = await inquirer.prompt(questions)
    return answers
}

const writeReadConf = async () => {
    console.log('Please enter config')
    let cnf = {}
    let config = await askConf()
    cnf.baseurl = config.url
    cnf.user = config.uname
    cnf.pw = config.pw
    filejson = JSON.stringify(cnf)
    fs.writeFileSync(`${os.homedir()}/.fsconcli.json`, filejson)
    console.log(`written: ${os.homedir()}/.fsconcli.json`)
}

const readConf = async () => {
    if (!checkFile(`${os.homedir()}/.fsconcli.json`)) {
        console.log('Incomplete or no credentials provided, no config found.\nPlease provide credentials with -u, -p and -s or create a configfile with:\nfsconcli config < -i | -u -p -s >')
        return { noconfig: true }
    }
    let config = JSON.parse(fs.readFileSync(`${os.homedir()}/.fsconcli.json`))
    let cnf = {}
    cnf.baseurl = config.baseurl
    cnf.user = config.user
    cnf.pw = config.pw
    return cnf;
}

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
    .command('config',
        'Write config file for fsconcli; after running this, subsequent calls don\'t need the -u, -p, and -s options anymore')
    .command('users',
        'Show list of users, by default shows all users. Use \'users -h\' for a list of options',
        (yargs) => {
            return yargs.option('id', {
                describe: 'Narrow list by user id',
                type: 'string',
                nargs: 1
            }).option('name', {
                describe: 'Narrow list by user name',
                type: 'string',
                nargs: 1
            }).option('context', {
                describe: 'Narrow list by user context',
                type: 'string',
                nargs: 1
            }).option('polymac', {
                describe: 'Narrow list by users polyphone mac',
                type: 'string',
                nargs: 1
            }).option('email', {
                describe: 'Narrow list by string matched to users emails',
                type: 'string',
                nargs: 1
            }).option('match', {
                describe: 'Narrow list by matching string to emails and names',
                type: 'string',
                nargs: 1
            })
        })
    .command('addusers [userarray]',
        'Add users, takes json array of userobjects as arg',
        (yargs) => {
            return yargs.option('f', {
                alias: 'file',
                describe: 'Read userarray from file',
                type: 'string',
                nargs: 1
            })
        })
    .command('modusers [userarray]',
        'Modify users, takes json array of userobjects as arg',
        (yargs) => {
            return yargs.option('f', {
                alias: 'file',
                describe: 'Read userarray from file',
                type: 'string',
                nargs: 1
            })
        })
    .command('delusers [userarray]',
        'Delete users, takes json array of userids as arg',
        (yargs) => {
            return yargs.option('f', {
                alias: 'file',
                describe: 'Read useridarray from file',
                type: 'string',
                nargs: 1
            })
        })
    .option('i', {
        alias: 'intac',
        type: 'boolean',
        describe: 'Be interactive',
        default: false
    })
    .option('o', {
        nargs: 1,
        type: 'string',
        describe: 'Output to named file',
        alias: 'out'
    })
    .option('t', {
        type: 'boolean',
        describe: 'Output text instead of json',
        default: false,
        alias: 'text'
    })
    .option('u', {
        nargs: 1,
        type: 'string',
        describe: 'Your username to login',
        alias: 'usr'
    })
    .option('p', {
        nargs: 1,
        type: 'string',
        describe: 'Your password to login',
        alias: 'pwd'
    })
    .option('s', {
        nargs: 1,
        type: 'string',
        describe: 'The api server address to login',
        alias: 'srv'
    })
    .help()
    .alias('help', 'h')
    .alias('version', 'v')
    .demandCommand(1, 1, 'You need a command', 'I can\'t handle more than 1 command')
    .argv;

const getClient = (conf) => {
    let client = new digfetch(conf.user, conf.pw)
    return client
}

const getPostoptions = (body) => {
    return {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    }
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

const users = (argv, client) => new Promise((resolve, reject) => {
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
                        txtdata += 'Users:\n-----\n'
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

const addusers = (text, postbody, client) => new Promise((resolve, reject) => {
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

const delUsers = (text, postbody, client) => new Promise((resolve, reject) => {
    client.fetch(`${conf.baseurl}/users/del`, getPostoptions(postbody))
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

const modUsers = (text, postbody, client) => new Promise((resolve, reject) => {
    client.fetch(`${conf.baseurl}/users/mod`, getPostoptions(postbody))
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
            message: 'How is the user called?'
        },
        {
            name: 'context',
            type: 'input',
            message: 'Which context should the user join?'
        },
        {
            name: 'email',
            type: 'input',
            message: 'What\'s the users email?'
        },
        {
            name: 'password',
            type: 'input',
            default: '',
            message: 'Custom password?'
        },
        {
            name: 'conpin',
            type: 'input',
            default: '',
            message: 'Custom conpin?'
        },
        {
            name: 'polymac',
            type: 'input',
            default: 'none',
            message: 'Provision a polycom phone?'
        },
        {
            name: 'again',
            type: 'confirm',
            message: 'Enter another user?',
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
            message: 'Choose userfilter',
            choices: ['all', 'id', 'name', 'context', 'polymac', 'email', 'match'],
            default: 'all'
        },
        {
            name: 'matchstring',
            type: 'input',
            message: 'Enter matchstring:',
            when: (choice) => choice.userfilter != 'all'
        }
    ]
    let answers = await inquirer.prompt(questions)
    return answers
}

const prepopulate = (client) => new Promise((resolve, reject) => {
    inquirer.prompt([
        {
            name: 'id',
            type: 'input',
            message: 'input userid:'
        }
    ])
        .then(async (answer) => {
            let usrans = {}
            await client.fetch(`${conf.baseurl}/users/byid/${answer.id}`)
                .then(resp => resp.text())
                .then(txt => {
                    try {
                        let data = JSON.parse(txt)
                        usrans = data
                    } catch (err) {
                        let data = txt
                        console.log(`ERROR: ${data}`)
                    }
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                })
            if (usrans.users.length < 1 || usrans.users.length > 1) {
                reject('User not found or not unique, try again')
            } else {
                resolve({
                    quest: [
                        {
                            name: 'name',
                            type: 'input',
                            message: 'New name for the user?',
                            default: usrans.users[0].name
                        },
                        {
                            name: 'context',
                            type: 'input',
                            message: 'New context for the user?',
                            default: usrans.users[0].context
                        },
                        {
                            name: 'email',
                            type: 'input',
                            message: 'New email for the user?',
                            default: usrans.users[0].email
                        },
                        {
                            name: 'password',
                            type: 'input',
                            message: 'Change password?',
                            default: usrans.users[0].password
                        },
                        {
                            name: 'conpin',
                            type: 'input',
                            message: 'Change conpin?',
                            default: usrans.users[0].conpin
                        },
                        {
                            name: 'polymac',
                            type: 'input',
                            message: 'Provision \'none\' or another polycom phone?',
                            default: usrans.users[0].polymac
                        },
                        {
                            name: 'again',
                            type: 'confirm',
                            message: 'Modify another user?',
                            default: false
                        }
                    ],
                    id: usrans.users[0].id
                })
            }
        })
})

const askModUsers = async (usrarr = [], client) => {
    let questions = []
    try {
        questionsall = await prepopulate(client)
        questions = questionsall.quest
    } catch (err) {
        console.log(err)
        return askModUsers(usrarr, client)
    }
    let { again, ...answers } = await inquirer.prompt(questions)
    answers.id = questionsall.id
    let newusers = [...usrarr, answers]
    return again ? askModUsers(newusers, client) : newusers
}

const delpopulate = (client) => new Promise((resolve, reject) => {
    inquirer.prompt([
        {
            name: 'id',
            type: 'input',
            message: 'input userid:'
        }
    ])
        .then(async (answer) => {
            let usrans = {}
            await client.fetch(`${conf.baseurl}/users/byid/${answer.id}`)
                .then(resp => resp.text())
                .then(txt => {
                    try {
                        let data = JSON.parse(txt)
                        usrans = data
                    } catch (err) {
                        let data = txt
                        console.log(`ERROR: ${data}`)
                    }
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                })
            if (usrans.users.length < 1 || usrans.users.length > 1) {
                reject('User not found or not unique, try again')
            } else {
                process.stdout.write('  User:\n')
                process.stdout.write(retTextUser(usrans.users[0]))
                process.stdout.write('  staged for deletion\n')
                resolve({
                    quest: [
                        {
                            name: 'again',
                            type: 'confirm',
                            message: 'Delete another user?',
                            default: false
                        }
                    ],
                    id: usrans.users[0].id
                })
            }
        })
})

const askDelUsers = async (usrarr = [], client) => {
    let questions = []
    try {
        questionsall = await delpopulate(client)
        questions = questionsall.quest
    } catch (err) {
        console.log(err)
        return askDelUsers(usrarr, client)
    }
    let { again, ...answers } = await inquirer.prompt(questions)
    answers.id = questionsall.id
    let delusers = [...usrarr, answers]
    return again ? askDelUsers(delusers, client) : delusers
}

async function runMe(argv) {
    let client = {}
    if (!argv.u || !argv.p || !argv.s) {
        if (argv._[0] !== 'config') {
            conf = await readConf()
            if (conf.noconfig) {
                return;
            }
        }
        if (argv._[0] == 'config') {
            if (argv.i) {
                conf = { noconfig: true }
            } else {
                console.log('Incomplete or no credentials provided,\nprovide credentials with -u, -p and -s\nor use -i to make me ask for credentials')
                return;
            }
        }
    } else {
        conf = { baseurl: argv.s, user: argv.u, pw: argv.p }
    }
    if (!conf.noconfig) {
        client = getClient(conf)
    }
    if (argv.i) {
        switch (argv._[0]) {
            case 'addusers': {
                let answers = await askAddUsers()
                argv.userarray = JSON.stringify(answers)
                break;
            }
            case 'modusers': {
                let manswers = await askModUsers([], client)
                argv.userarray = JSON.stringify(manswers)
                break;
            }
            case 'delusers': {
                let answers = await askDelUsers([], client)
                argv.userarray = JSON.stringify(answers)
                break;
            }
            case 'users': {
                let uanswers = await askUsers()
                if (uanswers.userfilter != 'all') {
                    argv[uanswers.userfilter] = uanswers.matchstring
                }
                break;
            }
            case 'config': {
                await writeReadConf()
                return;
            }
            default:
                console.log('i want to be interactive')
        }
    }
    switch (argv._[0]) {
        case 'config': {
            let cnf = {}
            cnf.baseurl = argv.s
            cnf.user = argv.u
            cnf.pw = argv.p
            filejson = JSON.stringify(cnf)
            fs.writeFileSync(`${os.homedir()}/.fsconcli.json`, filejson)
            console.log(`written: ${os.homedir()}/.fsconcli.json`)
            return;
        }
        case 'users': {
            if (argv.o) {
                if (!(checkPath(argv.o))) {
                    process.stdout.write(`ERROR: no path to ${argv.o}` + '\n')
                    return
                }
                users(argv, client)
                    .then(userlist => {
                        fs.writeFileSync(path.normalize(argv.o), userlist)
                        process.stdout.write(`written: ${path.normalize(argv.o)}` + '\n')
                        return
                    })
                    .catch(err => console.log(err))
            } else {
                users(argv, client)
                    .then(userlist => {
                        process.stdout.write(userlist)
                    })
                    .catch(err => console.log(err))
            }
            break;
        }
        case 'addusers': {
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
                addusers(argv.t, postbody, client)
                    .then(answer => {
                        fs.writeFileSync(path.normalize(argv.o), answer)
                        process.stdout.write(`written: ${path.normalize(argv.o)}` + '\n')
                        return
                    })
                    .catch(err => console.log(err))
            } else {
                addusers(argv.t, postbody, client)
                    .then(answer => {
                        process.stdout.write(answer)
                    })
                    .catch(err => console.log(err))
            }
            break;
        }
        case 'modusers': {
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
                process.stdout.write(`https://github.com/gidmoth/freeswitch-connector#post-apiusersmod` + '\n')
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
            let postbodymod = JSON.parse(argv.userarray)
            if (argv.o) {
                if (!(checkPath(argv.o))) {
                    process.stdout.write(`ERROR: no path to ${argv.o}` + '\n')
                    return
                }
                modUsers(argv.t, postbodymod, client)
                    .then(answer => {
                        fs.writeFileSync(path.normalize(argv.o), answer)
                        process.stdout.write(`written: ${path.normalize(argv.o)}` + '\n')
                        return
                    })
                    .catch(err => console.log(err))
            } else {
                modUsers(argv.t, postbodymod, client)
                    .then(answer => {
                        process.stdout.write(answer)
                    })
                    .catch(err => console.log(err))
            }
            break;
        }
        case 'delusers': {
            if (!process.stdin.isTTY && !argv.f && !argv.i) {
                try {
                    argv.userarray = await stdinRead()
                } catch (err) {
                    console.log(err)
                    return
                }
            }
            if (process.stdin.isTTY && !argv.f && !argv.i && !argv.userarray) {
                process.stdout.write(`The ${argv._[0]} command needs an usridarray.` + '\n')
                process.stdout.write(`You can provide it as JSON by either means:` + '\n\n')
                process.stdout.write(`  - interactive, use the -i flag` + '\n')
                process.stdout.write(`  - pipe to stdin` + '\n')
                process.stdout.write(`  - read from file, use the -f flag` + '\n')
                process.stdout.write(`  - as argument on invocation` + '\n\n')
                process.stdout.write(`For format information see here:` + '\n')
                process.stdout.write(`https://github.com/gidmoth/freeswitch-connector#post-apiusersdel` + '\n')
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
            let postbodymod = JSON.parse(argv.userarray)
            if (argv.o) {
                if (!(checkPath(argv.o))) {
                    process.stdout.write(`ERROR: no path to ${argv.o}` + '\n')
                    return
                }
                delUsers(argv.t, postbodymod, client)
                    .then(answer => {
                        fs.writeFileSync(path.normalize(argv.o), answer)
                        process.stdout.write(`written: ${path.normalize(argv.o)}` + '\n')
                        return
                    })
                    .catch(err => console.log(err))
            } else {
                delUsers(argv.t, postbodymod, client)
                    .then(answer => {
                        process.stdout.write(answer)
                    })
                    .catch(err => console.log(err))
            }
            break;
        }
        default:
            ;
    }
}

runMe(argv)
//users(argv.t)
//console.log(argv)

//users()



