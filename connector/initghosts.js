/**
 * Initializes ghost users on each startup
 */

const Ctxs = require('./config').getConfig('contexts')
CtxArr = Object.keys(Ctxs)
const confdir = require('./config').getConfig('confdir')
const fs = require('fs')
const path = require('path')
const reloadxml = require('./fseventusers/reloadxml')

//helper
const runReload = async (xmlState) => {
    reloadxml.run(xmlState)
        .then(msg => {
            return msg
        })
        .catch(err => {
            console.log(err)
            return err
        });
}

const getGhostUserFile = (user) => {
    return `<include>
    <user id="${user.id}">
      <params>
        <param name="vm-password" value="${user.id}"/>
        <param name="disable-register" value="true"/>
      </params>
      <variables>
        <variable name="user_context" value="${user.context}"/>
        <variable name="effective_caller_id_name" value="baz"/>
      </variables>
    </user>
</include>
`
}

const getGhostUsers = (ctx) => {
    return [{
        id: `ghost1`,
        context: `${ctx}`
    },
    {
        id: `ghost2`,
        context: `${ctx}`
    }
    ]
}

const writeGhosts = (xmlState) => {
    CtxArr.forEach(ctx => {
        let dir = Ctxs[ctx].path
        let ghosts = getGhostUsers(ctx)
        ghosts.forEach(gst => {
            let gstxml = getGhostUserFile(gst)
            fs.writeFileSync(path.join(dir, `${gst.id}.xml`), gstxml)
        })
    })
    runReload(xmlState)
}

exports.writeGhosts = writeGhosts