/**
 * main Script
 */

const Monitor = require('./fseventconsumers/esmonitor.js');
const xmlState = {};
const maintain = require('./maintainance');

Monitor.startMon(xmlState);

maintain.updateXmlState(xmlState);