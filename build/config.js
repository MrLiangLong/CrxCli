const path = require('path')
const moduleMap = require('./moduleMap')

const base = {
  env: process.env.NODE_ENV,
  pathBase: path.resolve(__dirname, '../'),
  dirDist: 'xgjPlugin',
  dirApp: 'app',
  port: 9090,
  dirHotFix: 'hotFix'
}
// 需要添加到的全局变量
base.globals = {
  'NODE_ENV': process.env.NODE_ENV,
  '__DPROD__': process.env.NODE_ENV === 'devBuild',
  '__DEV__' : process.env.NODE_ENV === 'development',
  '__TEST__' : process.env.NODE_ENV === 'test',
  '__HOT__' : process.env.NODE_ENV === 'hotFix',
  '__PROD__': process.env.NODE_ENV === 'production',
  '__PPEd__': process.env.NODE_ENV === 'packPhotoEditor'
}

base.packPath = [
  './app/content-scripts/',
  './app/inject-resource/'
]

base.hotFixModule = (function () {
  let modules = process.argv[process.argv.length - 1]
  if (modules.indexOf('module=') > -1) {
    modules = modules.split('=')[1].split(',')
    return modules.map(function (key) {
      return moduleMap[key.trim()]
    })
  }
})()

base.filterModule = [
  'plugWebsite',
  'sogoSearch'
]
exports.base = base
