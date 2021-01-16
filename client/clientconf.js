/**
 * Config for freeswitch-connector
 */

const configParams = {
    client: {
        baseurl: 'https://fcos.c8h10n4o2.news/api',
        user: 'stefan',
        pw: 'cGQn1e0aON'
    }
 };

 const getConfig = part => (configParams[part] !== undefined) ? configParams[part] : {};

 exports.getConfig = getConfig;
