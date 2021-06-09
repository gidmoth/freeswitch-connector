/**
 * Parsers for eventbodys
 */



const memObj = (mem) => {
    return {
        name: mem.caller_id_name,
        id: mem.caller_id_number,
        confid: mem.id,
        mute: !mem.flags.can_speak
    }
}

const getMems = (memarr) => {
    let mems = []
    memarr.forEach(mem => {
        mems.push(memObj(mem))
    })
    return mems;
}

const getFloor = (memarr) => {
    posi = memarr.findIndex(mem => mem.flags.has_floor == true)
    return memObj(memarr[posi])
}

const getRecstate = (allmemarr) => {
    let retval = {}
    let recnode = allmemarr.filter(mem => mem.type == 'recording_node')
    if (recnode.length > 0) {
        if (recnode[0].hasOwnProperty('status')) {
            retval.status = recnode[0].status
        } else {
            retval.status = 'running'
        }
        retval.file = recnode[0].record_path
    } else {
        retval.status = 'norec'
    }
    return retval;
}

const getLastJoin = (memarr) => {
    let ljoin = memarr.reduce((prev, curr) => (prev.join_time < curr.join_time) ? prev : curr, Infinity)
    return memObj(ljoin)
}

const listParse = (list) => {
    let conferences = []
    list.forEach(conf => {
        conferences.push({
            name: conf.conference_name,
            recording: getRecstate(conf.members),
            locked: conf.locked,
            floor: getFloor(conf.members.filter(mem => mem.type == 'caller')),
            lastjoin: getLastJoin(conf.members.filter(mem => mem.type == 'caller')),
            lastleave: {},
            memcount: conf.member_count,
            members: getMems(conf.members.filter(mem => mem.type == 'caller'))
        })
    });
    return conferences
}

const addMemParse = (evn) => {
    return {
        name: evn.getHeader('Caller-Caller-ID-Name'),
        id: evn.getHeader('Caller-Username'),
        confid: evn.getHeader('Member-ID'),
        mute: (evn.getHeader('Speak') === 'false') ? true : false
    }
}

const addConfParse = (evn) => {
    return {
        name: evn.getHeader('Conference-Name'),
        recording: {status: 'norec'},
        locked: false,
        floor: {},
        lastjoin: {},
        lastleave: {},
        memcount: +(evn.getHeader('Conference-Size')),
        members: []
    }
}

const regParse = (reglist) => {
    let regreturn = []
    if (reglist.row_count ===  0) {
        return regreturn
    } else {
        reglist.rows.forEach(row => {
            let usr = {}
            usr.id = row.reg_user
            usr.regid = row.token
            usr.sipcon = `${row.network_ip}:${row.network_port}`
            regreturn.push(usr)
        })
        return regreturn
    }

}

exports.listParse = listParse;
exports.addMemParse = addMemParse;
exports.addConfParse = addConfParse;
exports.regParse  = regParse;