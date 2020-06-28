const glob = require('glob')
const merge = require('webpack-merge')
const baseWebpack = require('./webpack.base')
const utils = require('./utils')
const config = require('./config').base
const entries = require('./entries')

utils.checkEntries(entries)  // 检验配置
const packPath = config.packPath
let hotFixEntries = {}
packPath.forEach(function (path) {
  const entryKey = path.indexOf('content-scripts') > -1 ? '**/entry.js' : '**/index.js'
  glob.sync(path + entryKey).forEach(function (entry) {
    const matches = /.*app\/(.*)\/\b(?:entry|index)\b\.js/.exec(entry)
    if (matches[1]) {
      hotFixEntries[matches[1]] = entry
    }
  })
})
let entry = Object.assign({
  background: utils.resolvePath.baseApp('background/main.js'),
  Popup: utils.resolvePath.baseApp('Popup/entry.js')
}, hotFixEntries)

if (config.hotFixModule) {
  const hotFixModules = Object.keys(entry).filter(module => config.hotFixModule.indexOf(module) > -1)
  for (let p in entry) {
    if (hotFixModules.indexOf(p) === -1) {
      delete entry[p]
    }
  }
}

module.exports = merge(baseWebpack, {
  entry: entry,
  output: {
		path: utils.resolvePath.base(config.dirHotFix), // 打包后的文件存放的地方
	}
})
