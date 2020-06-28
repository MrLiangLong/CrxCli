const axios = require('axios')
const fs = require('fs-extra')
const ora = require('ora')
// const FormData = require('form-data')
const invariant = require('invariant')
const allUploadQueue = [] // 所有要上传文件队列
const noop = function () {}
const defaultOptions = {
  perTotal: 5,
  success: noop,
  error: noop
}
const spinner = ora('uploading files... ')

function errorProcess (message, error) {
  console.log('\n')
  console.error(message)
  console.error(error)
  spinner.stop()
  throw error
}

function addFileToQueue (_path, fileName, size) {
  let type
  if (_path.indexOf('content-scripts') > -1) {
    type = 'cs'
  } else if (_path.indexOf('inject-resource') > -1) {
    type = 'ps'
  } else {
    type = 'bs'
  }
  let exist = fs.existsSync(_path)
  if (exist) {
    let obj = {
      data: _path,
      size: size,
      fileName: fileName,
      type,
      code: fs.readFileSync(_path).toString()
    }
    allUploadQueue.push(obj)
  }
}

function addDirToQueue (_path, cb) {
  let paths
  try {
    paths = fs.readdirSync(_path)
    paths.forEach(function (file) {
      let _src = `${_path}/${file}`
      let st = fs.statSync(_src)
      if (st.isDirectory()) {
        addDirToQueue(_src)
      } else {
        addFileToQueue(_src, file, st.size)
      }
    })
    typeof cb === 'function' && cb()
  } catch (e) {
    errorProcess(`读取${_path} 错误`, e)
    process.exit(1)
  }
}

function startUpload (options) {
  if (allUploadQueue.length === 0) {
    options.success()
    return
  }
  console.log(allUploadQueue.length)
  let tmp = []
  if (allUploadQueue.length >= options.perTotal) {
    tmp = allUploadQueue.splice(0, options.perTotal)
  } else {
    tmp = allUploadQueue.splice(0, allUploadQueue.length)
  }
  const promises = tmp.map(item => {
    let data ={
      name: item.fileName.replace('.js', ''),
      type: item.type,
      content: item.code
    }
    data = Object.assign({}, options.data, data)
    return axios.post(options.originUrl, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => {
      console.log('\n')
      console.log(`${item.fileName} 上传成功！`)
      console.log(`${item.fileName}`, res.data)
      return res.data
    }).catch(err => {
      errorProcess(`${item.fileName} 上传失败！`, err)
      process.exit(1)
    })
  })
  Promise.all(promises).then(
    data => {
      if (allUploadQueue.length) {
        startUpload(options)
      } else {
        console.log('所有代码上传成功')
        options.success()
        spinner.stop()
      }
    }).catch(error => {
      errorProcess(`file ${error.config.data._valuesToMeasure[0].path} upload failed`, error)
      process.exit(1)
    })
}

function uploadScriptFile (options = {}) {
  spinner.start()
  options = Object.assign({}, defaultOptions, options)
  invariant(options.file, 'upload file is required!')
  invariant(options.originUrl, 'upload originUrl is required!')
  invariant(options.data, 'data object is required!')
  addDirToQueue(options.file, function () {
    startUpload(options)
  })

}

module.exports = uploadScriptFile
