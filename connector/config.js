/**
 * Config for freeswitch-connector
 */

 const configParams = {
    freeswitch: {
        ip: `${process.env.FSIP || '127.0.0.1'}`,
        port: `${process.env.FSPORT || '8021'}`,
        pw: `${process.env.FSPW || 'ClueCon'}`
    },
    xmldir: `${process.env.SWITCHCONF || '/etc-freeswitch'}`,
    contexts: {
        team: {
            start: 20000,
            range: 1000,
            path: `${process.env.SWITCHCONF || '/etc-freeswitch'}/directory/team`,
            confStart: 30000,
            confRange: 1000
        },
        friends: {
            start: 21000,
            range: 1000,
            path: `${process.env.SWITCHCONF || '/etc-freeswitch'}/directory/friends`,
            confStart: 31000,
            confRange: 1000
        },
        public: {
            start: 22000,
            range: 1000,
            path: `${process.env.SWITCHCONF || '/etc-freeswitch'}/directory/public`,
            confStart: 32000,
            confRange: 1000
        }
    }
 };

 const getConfig = part => (configParams[part] !== undefined) ? configParams[part] : {};

 exports.getConfig = getConfig;