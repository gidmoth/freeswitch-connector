/**
 * Return Event emitter as livestate
 */

const EventEmitter = require('events')

class liveState extends EventEmitter {
    constructor () {
        super()
    }

}

module.exports = liveState;