const path = require('path')
const config = require('./config').base
const moduleMap = require('./moduleMap')

exports.resolvePath = (function () {
  const resolve = path.resolve

  const base = function () {
    let args = [config.pathBase].concat(Array.prototype.slice.call(arguments))
    return resolve.apply(resolve, args)
  }
  return {
    base: base,
    baseApp: base.bind(null, config.dirApp),
    baseDist: base.bind(null, config.dirDist)
  }
})()

exports.checkEntries = (entries) => {
  const cs = Object.keys(entries).filter(entry => entry.indexOf('content-scripts') > -1).map(entry => entry.replace('static/', '').replace('content-scripts/', ''))
  const ps = Object.keys(entries).filter(entry => entry.indexOf('inject-resource') > -1).map(entry => entry.replace('static/', '').replace('inject-resource/', ''))
  cs.concat(ps).forEach(entry => {
    if (!moduleMap[entry] && config.filterModule.indexOf(entry) === -1) {
      throw `模块 ${entry}, 还未配置`
    }
  })
}
