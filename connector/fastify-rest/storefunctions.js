/**
 * Functions to store/restore.
 */

const tar = require('tar-fs')
const fs = require('fs')
const zlib = require('zlib')

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

const reStoreDirectory = (source, target) => new Promise((resolve, reject) => {
    fs.createReadStream(source).pipe(zlib.createGunzip())
        .pipe(tar.extract(target)
            .on('error', (err) => {
                reject(err)
            }).on('finish', () => {
                resolve(target)
            }))
})


exports.storeDirectory = storeDirectory
exports.reStoreDirectory = reStoreDirectory