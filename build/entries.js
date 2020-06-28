const glob = require('glob')
const config = require('./config').base

const packPath = config.packPath
let entries ={}
packPath.forEach(function (path) {
  glob.sync(path + '**/index.js').forEach(function (entry) {
    const matches = new RegExp('.app/(.*)/index\\.js').exec(entry)
    if (matches[1]) {
      entries['static/' + matches[1]] = entry
    }
  })
})

module.exports = entries
