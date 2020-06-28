const testObj = {
  Init(){
    console.log('测试数据')
  }
}

if(window.CRX){
  window.CRX.testObj = testObj;
}else{
  window.CRX = {};
  window.CRX.testObj = testObj;
}

export default testObj;