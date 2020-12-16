/**
 * Basic state maintainance
 */

const getXmlState = require('./xmlimport/getxmlstate');
const getFilestate = require('./filestate/filesets');

function statelog(xmlState) {
    console.log(`

======= NEW STATE: =======

JSON State:
==========

${JSON.stringify(xmlState)}

Availsets:
=========

Users:
-----
next teamuser:      ${[...xmlState.availUsrIds.team][0]}
next frienduser:    ${[...xmlState.availUsrIds.friends][0]}
next publicuser:    ${[...xmlState.availUsrIds.public][0]}

Conferences:
-----------
next teamconference:    ${[...xmlState.availConfNums.team][0]}
next friendconference:  ${[...xmlState.availConfNums.friends][0]}
next publicconference:  ${[...xmlState.availConfNums.public][0]}

======= END STATE =======

`);
}

function updateXmlState(xmlState) {
    getXmlState.getUsers(xmlState)
    .then(xmlState => getXmlState.getConferences(xmlState))
    .then(xmlState => {
        getFilestate.getAvaiUsers(xmlState);
        getFilestate.getAvaiConfs(xmlState);
        statelog(xmlState);
    })
    .catch(error => {
        console.log(error);
    });
}

exports.updateXmlState = updateXmlState;