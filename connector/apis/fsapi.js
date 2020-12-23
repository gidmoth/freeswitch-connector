/**
 * Functions to interface with the freeswitch xml files
 */

const fs = require('fs');
const path = require('path');
const Contexts = require('../config').getConfig('contexts');
const Confpath = require('../config').getConfig('confdir');
const Provpaths = require('../config').getConfig('provisioningpaths');

// utilities
const getNext = (xmlState, thing, ctx) => {
    let next = ''
    if (thing == 'user') {
        next = `${[...xmlState.availUsrIds[ctx]][0]}`
        xmlState.availUsrIds[ctx].delete(next)
    }
    if (thing == 'conf') {
        next = `${[...xmlState.availConfNums[ctx]][0]}`
        xmlState.availConfNums[ctx].delete(next);
    }
    return next;
}


const newUsers = (xmlState, users) => new Promise ((resolve, reject) => {
    if (users == []) {
        reject('no users given');
    }
    let newusers = [];
    users.forEach(usr => {
        let newusr = {}
        newusr.id = getNext(xmlState, 'user', usr.context)
        newusers.push(newusr)
        console.log(`next free id: ${[...xmlState.availUsrIds[usr.context]][0]}`)
    })
    resolve(newusers);
});

exports.newUsers = newUsers;