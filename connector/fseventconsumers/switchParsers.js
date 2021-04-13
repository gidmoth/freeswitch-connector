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

const listParse = (list) => {
    let conferences = []
    list.forEach(conf => {
        conferences.push({
            name: conf.conference_name,
            recording: conf.recording,
            floor: getFloor(conf.members.filter(mem => mem.type == 'caller')),
            members: getMems(conf.members.filter(mem => mem.type == 'caller'))
        })
    });
    return conferences
}

exports.listParse = listParse;