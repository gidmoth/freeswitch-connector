/**
 * request listing to trigger building of livestate
 * for conferences
 */

 const API = require('../apis/esapi');
 const Parsers = require('../fseventconsumers/switchParsers')

 const run = (liveState) => new Promise((resolve, reject) => {
     console.log('now sending request')
     API.sendbgapi('conference json_list')
     .then(answer => {
         liveState.conferences = Parsers.listParse(JSON.parse(answer))
         console.log(liveState.conferences)
     })
     .catch(error => {
         reject(error);
     });
 });
 
 exports.run = run;