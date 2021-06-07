/**
 * request listing to trigger building of livestate
 * for conferences
 */

 const API = require('../apis/esapi');
 const Parsers = require('../fseventconsumers/switchParsers')

 const run = (liveState) => new Promise((resolve, reject) => {
     API.sendbgapi('conference json_list')
     .then(answer => {
         liveState.conferences = Parsers.listParse(JSON.parse(answer))
         /* console.log('\n')
         console.log('======= NEW LIVESTATE: =======\n')
         console.log('JSON State:\n==========\n')
         console.log(JSON.stringify(liveState.conferences))
         console.log('\n') */
         resolve()
     })
     .catch(error => {
         reject(error);
     });
 });

 const runreg = (liveState) => new Promise((resolve, reject) => {
    API.sendbgapi('show registrations as json')
    .then(answer => {
        liveState.registrations = Parsers.regParse(JSON.parse(answer))
        console.log('\n')
        console.log('======= NEW LIVESTATE: =======\n')
        console.log('JSON State:\n==========\n')
        console.log(JSON.stringify(liveState.conferences))
        console.log(JSON.stringify(liveState.registrations))
        console.log('\n')
        resolve()
    })
    .catch(error => {
        reject(error);
    });
});
 
 exports.run = run;
 exports.runreg = runreg;