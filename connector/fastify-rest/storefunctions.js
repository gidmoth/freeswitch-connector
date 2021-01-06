/**
 * Functions to store/restore.
 */

const tar = require('tar-fs')
const fs = require('fs')
const zlib = require('zlib')
const reloadxml = require('../fseventusers/reloadxml')

const storeDirectory = async (source, target) => {
    tar.pack(source).pipe(zlib.createGzip())
        .pipe(fs.createWriteStream(target, { emitClose: true })
            .on('error', (err) => {
                console.log(err)
            })
            .on('close', () => {
                console.log(`stored ${source} to ${target}`)
            }))
}

const reStoreDirectory = async (source, target, xmlState) => {
    fs.createReadStream(source).pipe(zlib.createGunzip())
        .pipe(tar.extract(target))
    reloadxml.run(xmlState)
        .then(msg => {
            console.log(`reloadxml after reStoreDirectory: ${msg.trim()}`)
        })
        .catch(err => {
            console.log(err)
        });
}

exports.storeDirectory = storeDirectory
exports.reStoreDirectory = reStoreDirectory