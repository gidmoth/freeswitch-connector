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
    confdir: `${process.env.SWITCHCONF || '/etc-freeswitch'}/dialplan/conferences`,
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
    },
    fasti: {
        port: `${process.env.FASTIPORT || 3000}`,
        ip: `${process.env.FASTIIP || '0.0.0.0'}`,
        hostname: `${process.env.CONHOSTNAME || 'localhost.localdomain'}`,
        apiallow: 'team',
        cert: `${process.env.FASTICERT || '/etc-freeswitch/tls/fullchain.pem'}`,
        key: `${process.env.FASTIKEY || '/etc-freeswitch/tls/privkey.pem'}`
    },
    provisioningpaths: {
        polycom: `${process.env.STATICPATH || '/static'}/polycom`,
        linphone: `${process.env.STATICPATH || '/static'}/linphone`
    }
 };

 const getConfig = part => (configParams[part] !== undefined) ? configParams[part] : {};

 exports.getConfig = getConfig;