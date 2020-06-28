import isString from 'lodash/isString'

/**
 * @param dbName 数据库名称
 * @param version 数据库版本 不传默认为1
 * @param primary 数据库表主键
 * @param indexList Array 数据库表的字段以及字段的配置,每项为Object，结构为{ name, keyPath, options }
 */
class WebDB {
  constructor({dbName, version, primary, indexList}) {
    this.db = null
    this.objectStore = null
    this.request = null
    this.primary = primary
    this.indexList = indexList
    this.version = version
    this.intVersion = parseInt(version.replace(/\./g, ''))
    this.dbName = dbName
    try {
      this.open(dbName, this.intVersion)
    } catch (e) {
      throw e
    }
  }

  open (dbName, version) {
    const indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    if (!indexedDB) {
      console.error('你的浏览器不支持IndexedDB')
    }
    this.request = indexedDB.open(dbName, version)
    this.request.onsuccess = this.openSuccess.bind(this)
    this.request.onerror = this.openError.bind(this)
    this.request.onupgradeneeded = this.onupgradeneeded.bind(this)
  }

  onupgradeneeded (event) {
    console.log('onupgradeneeded success!')
    this.db = event.target.result
    const names = this.db.objectStoreNames
    if (names.length) {
      for (let i = 0; i< names.length; i++) {
        if (this.compareVersion(this.version, names[i]) !== 0) {
          this.db.deleteObjectStore(names[i])
        }
      }
    }
    if (!names.contains(this.version)) {
      this.objectStore = this.db.createObjectStore(this.version, { keyPath: this.primary })
      this.indexList.forEach(index => {
        const { name, keyPath, options } = index
        this.objectStore.createIndex(name, keyPath, options)
      })
    }
  }

  openSuccess (event) {
    console.log('openSuccess success!')
    this.db = event.target.result
  }

  openError (event) {
    console.error('数据库打开报错', event)
    // 重新链接数据库
    if (event.type === 'error' && event.target.error.name === 'VersionError') {
      indexedDB.deleteDatabase(this.dbName);
      this.open(this.dbName, this.intVersion)
    }
  }

  compareVersion (v1, v2) {
    if (!v1 || !v2 || !isString(v1) || !isString(v2)) {
      throw '版本参数错误'
    }
    const v1Arr = v1.split('.')
    const v2Arr = v2.split('.')
    if (v1 === v2) {
      return 0
    }
    if (v1Arr.length === v2Arr.length) {
      for (let i = 0; i< v1Arr.length; i++) {
        if (+v1Arr[i] > +v2Arr[i]) {
          return 1
        } else if (+v1Arr[i] === +v2Arr[i]) {
          continue
        } else {
          return -1
        }
      }
    }
    throw '版本参数错误'
  }

  /**
   * 添加记录
   * @param record 结构与indexList 定下的index字段相呼应
   * @return Promise
   */
  add (record) {
    if (!record.key) throw '需要添加的key为必传字段!'
    return new Promise((resolve, reject) => {
      let request
      try {
        request = this.db.transaction([this.version], 'readwrite').objectStore(this.version).add(record)
        request.onsuccess = function (event) {
          resolve(event)
        }

        request.onerror = function (event) {
          console.error(`${record.key},数据写入失败`)
          reject(event)
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * 读取记录
   * @param key 主键的值
   * @return Promise
   */
  get (key) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let request
        try {
          request = this.db.transaction([this.version]).objectStore(this.version).get(key)
          request.onerror = function (event) {
            console.error(`${key}, 数据读取失败!`)
            reject(event)
          }

          request.onsuccess = function (event) {
            if (request.result) {
              resolve(request.result)
            } else {
              reject(event)
            }
          }
        } catch (e) {
          reject(e)
        }
      }, 200)
    })
  }

  /**
   * 更新记录
   * @param record 结构与indexList 定下的index字段相呼应
   * @return Promise
   */
  update (record) {
    return new Promise((resolve, reject) => {
      // const request = this.db.transaction([this.version], 'readwrite').objectStore(this.version).put(record)
      let request
      try {
        request = this.db.transaction([this.version], 'readwrite').objectStore(this.version).put(record)
        request.onsuccess = function (event) {
          resolve(event)
        };

        request.onerror = function (event) {
          console.error(`${record.key},数据更新失败`)
          reject(event)
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * 删除记录
   * @param key 主键的值
   * @return Promise
   */
  remove (key) {
    return new Promise((resolve, reject) => {
      const request = this.db.transaction([this.version], 'readwrite').objectStore(this.version).delete(key);

      request.onsuccess = function (event) {
        resolve(event)
      }
      request.onerror = function (event) {
        console.error(`${key}, 数据删除失败`)
        reject(event)
      }
    })
  }
}

export default WebDB
