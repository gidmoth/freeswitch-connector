/**
 * main Script
 */

const Monitor = require('./fseventconsumers/esmonitor.js');
const xmlState = {};
const getXmlState = require('./xmlimport/getxmlstate')

Monitor.startMon();

getXmlState.getUsers(xmlState);







function statetest() {
    console.log(JSON.stringify(xmlState));
}
setTimeout(statetest, 3600);