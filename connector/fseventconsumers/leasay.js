/**
 * call  custom conference recs
 */

const API = require('../apis/esapi');

const leaSay = (conf, what) => new Promise((resolve,  reject) => {
    switch (what) {
        case 'paused': {
            API.sendbgapi(`conference ${conf} play conference/recording_paused_to_resume_press_resume.wav`)
                .then(answer => {
                    resolve(answer);
                })
                .catch(error => {
                    reject(error);
                });
            break;
        }
        case 'already': {
            API.sendbgapi(`conference ${conf} play conference/already_recording.wav`)
                .then(answer => {
                    resolve(answer);
                })
                .catch(error => {
                    reject(error);
                });
            break;
        }
        case 'norec': {
            API.sendbgapi(`conference ${conf} play conference/not_recording_to_start_press_start.wav`)
                .then(answer => {
                    resolve(answer);
                })
                .catch(error => {
                    reject(error);
                });
            break;
        }
        case 'start': {
            API.sendbgapi(`conference ${conf} play conference/recording_started.wav`)
                .then(answer => {
                    resolve(answer);
                })
                .catch(error => {
                    reject(error);
                });
            break;
        }
        case 'stop': {
            API.sendbgapi(`conference ${conf} play conference/recording_stopped.wav`)
                .then(answer => {
                    resolve(answer);
                })
                .catch(error => {
                    reject(error);
                });
            break;
        }
        case 'resume': {
            API.sendbgapi(`conference ${conf} play conference/resuming_recording.wav`)
                .then(answer => {
                    resolve(answer);
                })
                .catch(error => {
                    reject(error);
                });
            break;
        }
        case 'pausing': {
            API.sendbgapi(`conference ${conf} play conference/recording_paused.wav`)
                .then(answer => {
                    resolve(answer);
                })
                .catch(error => {
                    reject(error);
                });
            break;
        }
    }
})

exports.leaSay = leaSay;