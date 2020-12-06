/**
 * parsers for jsonified xml
 */

function genArrayFilter(arr, aname) {
    return arr.filter(item => item.attrib_name == aname)[0].attrib_value;
}

function parseUser(usr) {
    let puser = {
        id: usr.attrib_id,
        password: genArrayFilter(usr.params.param, "password"),
        context: genArrayFilter(usr.variables.variable, "user_context"),
        name: genArrayFilter(usr.variables.variable, "effective_caller_id_name")
    }
    return puser;
}

const parseDirectory = (dir) => {
    let pusers = [];
    dir.section.domain.groups.group.forEach(gr => {
        gr.users.user.forEach(u => {
            pusers.push(parseUser(u));
        })
    })
    return pusers;
}

exports.parseDirectory = parseDirectory;

