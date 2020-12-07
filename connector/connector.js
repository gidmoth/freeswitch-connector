/**
 * main Script
 */

const Monitor = require('./fseventconsumers/esmonitor.js');
const xmlState = {};
const getXmlState = require('./xmlimport/getxmlstate');
const getFilestate = require('./filestate/filesets');

Monitor.startMon();

getXmlState.getUsers(xmlState)
.then(xmlState => getFilestate.getAvaiUsers(xmlState))
.catch(error => {
    console.log(error);
});


function statetest() {
    console.log(JSON.stringify(xmlState));
    console.log([...xmlState.availUsrIds.team][0]);
}
setTimeout(statetest, 3600);