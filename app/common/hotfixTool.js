import {CRX,deepsFilterModule} from './constant.js';

const insertScript = (injectUrl, id, reject) => {
  if (document.getElementById(id)) {
    return
  }
  const temp = document.createElement('script');
  temp.setAttribute('type', 'text/javascript');
  temp.setAttribute('id', id)
  temp.src = injectUrl
  temp.onerror = function() {
    console.warn(`pageScript ${id},线上代码解析失败`)
    reject()
  }
  document.head.appendChild(temp)
}

const parseCode = (moduleName, code, reject) => {
  try {
    eval(code)
    CRX[moduleName].init()
  } catch (e) {
    console.warn(moduleName + ' 解析失败: ', e)
    reject(e)
  }
}

function deepsReady(checkDeeps, execute, time = 100){
  let exec = function(){
    if(checkDeeps()){
      execute();
    }else{
      setTimeout(exec,time);
    }
  }
  setTimeout(exec,0);
}

const hotFix = (moduleName, type = 'cs') => {
  if (!moduleName) {
    return Promise.reject('参数错误')
  }
  return new Promise((resolve, reject) => {
    if (!__PROD__ && !__HOT__ && !__TEST__) {//开发环境下不走热修复
      if (deepsFilterModule.indexOf(moduleName) > -1) {
        reject()
      } else { //开发环境,等待$COM公共资源价值完成,再执行业务逻辑代码
        deepsReady(
          () => CRX && CRX.$COM && Object.keys(CRX.$COM).length,
          reject
        )
      }
      return
    }
    /*
    * PageScript: 往页面注入js脚本
    * ContentScript:等待本地$COM资源创建完成,解析热更新代码,覆盖本地原对象
    * ContentScriptCommon|Popup:解析热更新代码,覆盖本地原对象
    */
    chrome.extension.sendRequest({
      name: "getHotFixCode",
      type: type,
      moduleName
    }, function(res) {
      if (res.status === 'success') {
        if (type !== 'ps') {
          if (deepsFilterModule.indexOf(moduleName) === -1) {
            deepsReady(() => CRX && CRX.$COM && Object.keys(CRX.$COM).length, () => parseCode(moduleName, res.code, reject))
          } else {
            parseCode(moduleName, res.code, reject)
          }
        } else {
          insertScript(res.code, moduleName, reject)
        }
      } else {
        if (deepsFilterModule.indexOf(moduleName) === -1) {
          deepsReady(() => CRX && CRX.$COM && Object.keys(CRX.$COM).length, () => reject('线上代码不存在！'))
        } else {
          reject('线上代码不存在！')
        }
      }
    })
  })
}

export default hotFix
