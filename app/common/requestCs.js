import { assign } from './utils'
import COM from './common'

export const getBizKey = () => {
  return new Promise((resolve, reject) => {
    try {
      COM.getBizStorage(function (bizKey) {
        if (bizKey === null || bizKey === undefined) {
          reject('bizkey 不存在')
          return
        }
        resolve({
          bizkey: bizKey
        })
      })
    } catch (e) {
      throw e
    }
  })
}

export const getBaseInfo = () => {
  return new Promise((resolve, reject) => {
    COM.getRequestBaseInfo(function (baseInfo) {
      if (!baseInfo) return reject('获取getBaseInfo出错')
      const {uid, uuid, ver} = baseInfo
      if (!uid || !uuid || !ver) {
        console.warn('userkey，Machinekey，version等基础信息缺失！')
      }
      resolve({
        userkey: uid,
        Machinekey: uuid,
        pluginVersion: ver
      })
    })
  })
}

const getAllBaseInfo = (options) => {
  return getBaseInfo().then(BaseInfoRes => {
    if (options.getbizKey) {
      return BaseInfoRes
    }
    return getBizKey().then(bizkeyRes => {
      return assign({}, BaseInfoRes, bizkeyRes)
    }).catch(err => {
      console.warn(`获取bizkey失败！`)
      return assign({}, BaseInfoRes)
    })
  })
}

const sendRequestToBack = (options) => {
  return new Promise((resolve, reject) => {
    chrome.extension.sendRequest({
      name: "sendWebRequest",
      options
    }, function (res) {
      if (!res || res.status === 'err') {
        reject(res)
      } else {
        resolve(res)
      }
    });
  })
}

const requestCs = (options) => {
  return getAllBaseInfo(options).then(headers => {
    const {headers: optHeaders = {}} = options
    options.headers = assign({}, headers, optHeaders)
    return sendRequestToBack(options)
  }).catch(err => {
    throw err
  })
}

;['GET', 'POST', 'DELETE', 'PUT', 'PATCH'].forEach(method => {
  requestCs[method.toLowerCase()] = (options) => {
    return requestCs(assign({}, options, {
      method: method
    }))
  }
})

export default requestCs
