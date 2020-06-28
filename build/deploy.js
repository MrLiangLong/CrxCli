const uploadScriptFile = require('./upload/index')
const rm = require('rimraf')
const utils = require('./utils')
const manifest = require('../app/manifest.json')

const options = {
  file: utils.resolvePath.base('hotFix'),
  originUrl: 'http://chromepluginapi.xiguaji.com/api/OnlineModule/Upload',
  data: {
    version: manifest.version,
    password: 'xiguaPlugin@2018',
  },
  success: function () {
    rm(utils.resolvePath.base('hotFix'), function (err) {
      if (err) {
        throw err
      }
    })
  }
}

uploadScriptFile(options)
