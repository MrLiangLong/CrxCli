const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ChromeReloadPlugin = require('webpack-chrome-extension-reloader')
const baseWebpack = require('./webpack.base')
const utils = require('./utils')
const config = require('./config').base
const entries = require('./entries')

utils.checkEntries(entries)  // 检验配置
const globalConfig = config.globals
const initPlugins = [
  new HtmlWebpackPlugin({
    filename: utils.resolvePath.baseDist('popPage/index.html'),
    template: utils.resolvePath.baseApp('Popup/index.html'),
    inject: true,
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeAttributeQuotes: true
    },
    chunksSortMode: 'dependency',
    chunks: ['popPage/Popup']
  }),
  new CopyWebpackPlugin([{ from: utils.resolvePath.baseApp('static'),
    to: utils.resolvePath.baseDist('static') }, {
    from: utils.resolvePath.baseApp('manifest.json'),
    to: utils.resolvePath.baseDist('manifest.json')
  }])
]
const ppedEntry = {
  'react-photo-layout-editor': utils.resolvePath.baseApp('lib/react-photo-layout-editor/index.js'),
  'dataBoardPlugin': utils.resolvePath.baseApp('lib/dataBoardPlugin/index.js'),
  'datePicker': utils.resolvePath.base('node_modules/iview/src/components/date-picker/index.js')
}

const webConfig = merge(baseWebpack, {
  entry: globalConfig.__PPEd__ ? ppedEntry : Object.assign({
    'background': utils.resolvePath.baseApp('background/index.js'),
    'popPage/Popup': utils.resolvePath.baseApp('Popup/index.js')
  }, entries),
  output: {
    path: utils.resolvePath.baseDist(), // 打包后的文件存放的地方
  },
  plugins: !globalConfig.__PPEd__ ? (globalConfig.__DEV__ || globalConfig.__HOT__ ? initPlugins.concat([new ChromeReloadPlugin({
    port: config.port,
    reloadPage: true,
    entries: {
      background: 'background',
      contentScript: Object.keys(entries).filter(function (item) {
        return item.indexOf('content-scripts') > -1
      })
    }
  })]) : initPlugins) : []
})

module.exports = webConfig
