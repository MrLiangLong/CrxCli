import { assign } from './utils'
const encode = window.encodeURIComponent
export const addParam = (url, params) => {
  let arr = Object.keys(params).map(key => encode(key) + '=' + encode(params[key])).join('&')

  if (!arr) {
    return url
  }

  return url + (url.indexOf('?') !== -1 ? '&' : '?') + arr
}

const request = (options) => {
  let { url, params, ...other } = options
  if (params && url) {
    url = addParam(url, params)
  }

  return window.axios({
    url,
    responseType: 'text',
    traditional: true,
    transformResponse: [function (responseText) {
      // let data = responseText.replace(/^\)\]\}',?\n/, '')
      try {
        let data = JSON.parse(responseText)
        return data
      } catch (e) {
        return responseText
      }
    }],
    ...other
  }).then(res => {
    if (res.data !== null || res.data !== undefined) {
      return res.data
    }
    throw ('缺少data!')
  })
  //   .catch((err, a, b) => {
  //   console.error(`request is error, url is ${url}`, err)
  //   throw err
  // })
}

;['GET', 'POST', 'DELETE', 'PUT', 'PATCH'].forEach(method => {
  request[method.toLowerCase()] = (options) => {
    return request(assign({}, options, {
      method: method
    }))
  }
})

export default request
