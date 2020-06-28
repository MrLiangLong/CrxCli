import getHotFixCode from './hotfixTool'
import moduleMap from '../../../build/moduleMap'

class HotFix {
  constructor() {
    chrome.extension.onRequest.addListener(this.requestListener)
    if (__PROD__ || __HOT__ || __TEST__) {
      try {
        this.getModuleCode()
      }catch (e) {
        console.warn(e)
      }
    }
  }

  requestListener (request, sender, sendResponse) {
    switch(request.name) {
      case 'getHotFixCode':
        getHotFixCode(request, sendResponse)
        break
    }
  }

  getModuleCode () {
    delete moduleMap['background']
    for (let p in moduleMap) {
      let type
      if (moduleMap[p].indexOf('content-scripts') > -1) {
        type = 'cs'
      } else if (moduleMap[p].indexOf('inject-resource') > -1) {
        type = 'ps'
      } else {
        type = 'bs'
      }
      getHotFixCode({moduleName: p, type})
    }
  }
}

export default new HotFix()
