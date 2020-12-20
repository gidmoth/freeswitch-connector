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

const getUsers = (xmlState) => new Promise((resolve, reject) => {
    XmlConf.getDir()
    .then(directory => {
        let jsonUsers = fastxml.parse(directory, options);
        let newusers = pJ.parseDirectory(jsonUsers);
        xmlState.users = newusers;
        resolve(xmlState);
    })
    .catch(error => {
        console.log(error);
        reject(error);
    });
});

const getConferences = (xmlState) => new Promise((resolve, reject) => {
    XmlConf.getDp()
    .then(plan => {
        let jsonPlan = fastxml.parse(plan, options);
        let newconfs = pJ.parseConferences(jsonPlan);
        xmlState.conferences = newconfs;
        resolve(xmlState);
    })
    .catch(error => {
        console.log(error);
        reject(error);
    });
});

const getGlobals = (xmlState) => new Promise((resolve, reject) => {
    XmlConf.getGlob()
    .then(globs => {
        let globject = {};
        globs.split('\n').forEach(element => {
            let property = element.split('=')[0];
            if (property !== '') {
                globject[property] = `${element.split('=')[1]}`;
            }
        });
        xmlState.globals = globject;
        resolve(xmlState);
    })
    .catch(error => {
        console.log(error);
        reject(error);
    });
});

exports.getUsers = getUsers;
exports.getConferences = getConferences;
exports.getGlobals = getGlobals;