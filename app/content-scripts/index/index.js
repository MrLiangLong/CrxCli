import hotFix from '../../common/hotfixTool.js';
import testObj from './entry'

hotFix('testObj').catch(err => {
  console.warn(`testObj 线上代码解析失败！`, err)
 	testObj.init();
})
