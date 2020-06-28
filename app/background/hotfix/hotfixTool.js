import WebDB from './webDB'
import isFunction from 'lodash/isFunction'
import request, { addParam } from '../../common/request'
import API from '../api'

const moduleCache = {}
const dbName = 'codeBak'
const version = API.plugin.version
const moduleStatus = {}
let DBRequest
const getLastCode = (moduleName, type) => {
  const cdnUrl = 'https://plugin-module.xiguaji.com'
  const scriptUrl = addParam(`${cdnUrl}/${version}/${type}/${moduleName}.js`, {
    _: new Date().getTime()
  })
  if (type === 'ps') {
    updateModuleCode(moduleName, scriptUrl)
    return
  }
  return request.get({
    url: scriptUrl
  }).then(res => {
    updateModuleCode(moduleName, res.trim())
    return res.trim()
  })
}
const updateModuleCode = (moduleName, code, dbRequest = DBRequest) => {
  dbRequest.get(moduleName).then(record => {
    if (record) {
      dbRequest.update({
        key: moduleName,
        value: code
      }).then(() => {
        moduleStatus[moduleName] = 'loaded'
      }).catch(err => {
        console.warn(`数据更新${moduleName}失败！`, err)
      })
    }
  }).catch(() => {
    dbRequest.add({
      key: moduleName,
      value: code
    }).then(() => {
      moduleStatus[moduleName] = 'loaded'
    }).catch(err => {
      console.warn(`${moduleName} 添加数据库失败！`, err)
    })
  })

  moduleCache[moduleName] = code
}

const getBackGroundCode = (moduleName, type, sendResponse) => {
  getLastCode(moduleName, type).then(res => {
    isFunction(sendResponse) && sendResponse({
      status: 'success',
      code: res
    })
  }).catch(err => {
    DBRequest.get(moduleName).then(res => {
      if (res.value.trim().length) {
        isFunction(sendResponse) && sendResponse({
          status: 'success',
          code: res.value
        })
      } else {
        isFunction(sendResponse) && sendResponse({
          status: 'error'
        })
      }
    }).catch(err => {
      console.warn(moduleName, ' :indexDB获取代码失败：', err)
      isFunction(sendResponse) && sendResponse({
        status: 'error',
        msg: err
      })
    })
  })
}

const getHotFixCode = ({moduleName, type}, sendResponse) => {
  if (!DBRequest) {
    try {
      DBRequest = new WebDB({
        dbName,
        version,
        primary: 'key',
        indexList: [{ name: 'value', KeyPath: 'value', options: { unique: true } }]
      })
    } catch (e) {
      console.warn(moduleName, ' :链接数据库失败：', e)
      isFunction(sendResponse) && sendResponse({
        status: 'error',
        msg: e
      })
      return
    }
  }

  if (moduleName === 'background' && type === 'bs') {
    getBackGroundCode(moduleName, type, sendResponse)
    return
  }

  if (moduleCache[moduleName]) {
    isFunction(sendResponse) && sendResponse({
      status: 'success',
      code: moduleCache[moduleName]
    })
    moduleStatus[moduleName] !== 'loaded' && getLastCode(moduleName, type)
  } else {
    setTimeout(() => {
      DBRequest.get(moduleName).then(res => {
        if (res.value.trim().length) {
          isFunction(sendResponse) && sendResponse({
            status: 'success',
            code: res.value
          })
        } else {
          isFunction(sendResponse) && sendResponse({
            status: 'error'
          })
        }
        moduleStatus[moduleName] !== 'loaded' && getLastCode(moduleName, type)
      }).catch(err => {
        console.warn(moduleName, ' :indexDB获取代码失败：', err)
        isFunction(sendResponse) && sendResponse({
          status: 'error',
          msg: err
        })
        moduleStatus[moduleName] !== 'loaded' && getLastCode(moduleName, type)
      })
    }, 50)
  }
}

export default getHotFixCode
