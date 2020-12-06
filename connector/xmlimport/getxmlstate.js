/**
 * parses xml from socketrequest and updates state
 */

const XmlConf = require('../fseventusers/getxmlconfig');
const pJ = require('./jsonparsers');
const fastxml = require('fast-xml-parser');
const options = {
    ignoreAttributes : false,
    attributeNamePrefix : "attrib_"
};

const getUsers = (xmlState) => {
    XmlConf.getDir()
    .then(directory => {
        let jsonUsers = fastxml.parse(directory, options);
        let newusers = pJ.parseDirectory(jsonUsers);
        xmlState.users = newusers;
    })
    .catch(error => {
        console.log(error);
    });
}

exports.getUsers = getUsers;