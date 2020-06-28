import hotFix from './hotfixTool'
import isFunction from 'lodash/isFunction'
import assign from 'lodash/assign'
import requestCs from './requestCs.js';
/*
 *存储API
 */
var getStorage = function(e) {
		return window.localStorage ? window.localStorage.getItem(e) : (console.log("不支持 localstorage"), null)
	}

var setStorage = function(e, t) {
		return window.localStorage ? window.localStorage.setItem(e, t) : (console.log("不支持 localstorage"), null)
	}

var removeStorage = function(e) {
		return window.localStorage ? window.localStorage.removeItem(e) : (console.log("不支持 localstorage"), null)
	}

var STORAGE = {
		getStorage: getStorage,
		setStorage: setStorage,
		removeStorage: removeStorage
	}

var getRequestBaseInfo = function(cb){
        let uidDfd = $.Deferred(),
            uuidDfd = $.Deferred(),
            versionDfd = $.Deferred()
            ;
        var uid, uuid, version;
        chrome.extension.sendRequest({
            key: "uuid",
            name: "getLocalStorage"
        }, function (res) {
            uuid = res;
            uidDfd.resolve();
        });

        chrome.extension.sendRequest({
            key: "user",
            name: "getLocalStorage"
        }, function (res) {
            try {
                uid = JSON.parse(res).userKey;
            } catch (e) { }
            uuidDfd.resolve();
        });

        chrome.extension.sendRequest({
            name: "getVersion"
        }, function (res) {
            version = res;
            versionDfd.resolve();
         });

        $.when(uidDfd, uuidDfd, versionDfd).then(function () {
            cb({ uid: uid, uuid: uuid, ver: version });
        });
}

/*
 *全局变量
 *
 **/

var zsurl = 'http://zs.xiguaji.com/';
var sjurl = 'http://data.xiguaji.com';

var GLOBAL = {}

GLOBAL.Xgj_ExtensinId = chrome.i18n.getMessage("@@extension_id");
var CHROME_URL = "chrome-extension://" + GLOBAL.Xgj_ExtensinId;

GLOBAL.getQuertString = function(name, url) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
	var r = (url || window.location.search).substr(1).match(reg);
	if(r != null) return unescape(r[2]);
	return null;
}

GLOBAL.timestampToTime = function(timestamp) {
	var date = new Date(timestamp * 1000), //时间戳为10位需*1000，时间戳为13位的话不需乘1000
	Y = date.getFullYear() + '-',
	M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-',
	D = (date.getDate()) < 10 ? '0' + date.getDate() : date.getDate(),
	h = date.getHours() + ':',
	m = date.getMinutes() + ':',
	s = date.getSeconds();
	return Y+M+D;
}

GLOBAL.windowScrollToTop = function() {
	document.body.scrollTop = document.documentElement.scrollTop = 0;
}

//用户登录状态
GLOBAL.loginStatus = false;

//判断用户是否登录
GLOBAL.judgeLogin = function(callback){
	chrome.extension.sendRequest({
		name:'getLoginState'
	},function(response){
		if(response.errmsg == 'ok'){
			GLOBAL.loginStatus = response.loginState;

			if(callback != '' && typeof callback === 'function') {
				callback(response)
			}
		}
	})
}
GLOBAL.judgeLogin();

var COMPONENT = {
		//未登录组件
		createLoginNotice: function() {
			var loginNotice = $(`<div id="xgj-login-notice"></div>`)
			$(document.body).append(loginNotice);

			var loginNoticeNode = new Vue({
				el: '#xgj-login-notice',
				template: `
				<div id="xgj-login-notice" style="display:none;">
					<div class="xgj-login-notice-box">
					<header>
						<p class="notice-header">
							<span>请登录</span>
							<span @click="hideLoginNotice" id="closeSimilarBtn"></span>
						</p>						
					</header>
					<div>
						<p class="notice">要使用此功能，请先登录西瓜插件</p>
						<p><span @click="toLogin" class="noticeBtn">登录</span></p>
					</div>
					</div>
				</div>
			    `,
				methods: {
					toLogin:function() {
						var that = this;
						GLOBAL.judgeLogin(function(res){
							if(res.loginState){
								$('#xgj-login-notice').css({'display': 'none'})
								return;
							}
						})

						var url = window.location.href;
						chrome.extension.sendRequest({
							"name": "getLoginTicket",
							articalUrl:url
							}, function(response) {
								if(response.errmsg == 'ok'){
									var ticket = response.ticket;
									var qrCodeUrl = response.qrCodeUrl;
							//	  	that.loginConnect();
								  	var wUrl = window.location.href;
								  	var url =  qrCodeUrl+'&from=1';
								  	if(wUrl.indexOf('mp.weixin.qq.com/s') != -1 || wUrl.indexOf("w.url.cn/s")!= -1){
								  		url = qrCodeUrl+'&from=1'+'&aurl='+window.location.href;
								  	}
									$('#xgj-login-notice').css({'display': 'none'});
									window.open(url);

								}
							})
					},
					loginConnect:function(){
						var port = chrome.extension.connect({name:'login'});
						port.postMessage({'msg':'islogin'});
						port.onMessage.addListener(function(msg){
							if(msg.isLogin){
								$('#xgj-login-notice').css({'display': 'none'})
							}
						})
					},
					hideLoginNotice:function(){
						$('#xgj-login-notice').css({'display': 'none'})
					}
				}
			})
		},
		loading:{
			show:function(){
				$("#com-load-box").show();
			},
			hide:function(){
				$("#com-load-box").hide();
			},
			setTxt:function(txt){
				$('#comLoadTxt').text(txt);
			},
			createLoading:function(){
				var loadBox = $('<div id="com-load-box" style="display:none"></div>');
				$(document.body).append(loadBox);

					new Vue({
					el:"#com-load-box",
					data: function(){
						return {
							imgUrl:CHROME_URL + '/static/img/loading.gif',
							txt:'加载中...'
						}
					},
					template:`
						<div id="com-load-box" style="display:none">
							<div class="load-content-box">
								<img id="com-load-img" :src="imgUrl" />
								<p id="comLoadTxt" class="com-load-txt">{{txt}}</p>
							</div>
						</div>
					`,
					mounted(){
						$("#com-load-box").hide();
					}
				})
			}
		}


}
COMPONENT.createLoginNotice();

var PLUGIN = {
	config:[],
	version:"",
	getConfig:function (cb){
		chrome.extension.sendRequest({
			name:'getPlugConfig'
		},function(response){
			if(response.errmsg == 'ok'){
				PLUGIN.config = response.plugConfig;
				typeof cb=="function" && cb(response.plugConfig);
			}
		})
	},
	getVersion:function(){
		chrome.extension.sendRequest({
			"name":"getVersion"
		},function(res){
			PLUGIN.version = res;
		})
	}
};
PLUGIN.getConfig();
PLUGIN.getVersion();

function originInject (jsPath, id, cb) {
	if(id&&document.getElementById(id)){
		typeof cb=="function" && cb();
		return;
	}

	jsPath = jsPath || '';
	var temp = document.createElement('script');
	temp.setAttribute('type', 'text/javascript');
	// 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
	temp.src = chrome.extension.getURL(jsPath);
	if(id){
		temp.id = id;
	}
	temp.onload = function()
	{
		typeof cb=="function" && cb();
		// 放在页面不好看，执行完后移除掉
		if(!id){
			//this.parentNode.removeChild(this);
		}
	};
	document.head.appendChild(temp);
}

//注入js
function injectCustomJs(jsPath,cb,id){
	if ((__PROD__ || __TEST__ || __HOT__) && jsPath.indexOf('inject-resource') > -1) {
		const pathArr = jsPath.split('/')
		const moduleName = pathArr[pathArr.length - 1].replace('.js', '')
		hotFix(moduleName, 'ps').catch(err => {
		  console.warn(`${moduleName} 线上代码解析失败`)
			originInject(jsPath, id, cb)
		})
		return
	}

	originInject(jsPath, id, cb)
}

//动态加载css
function loadCssCode(code){
    var style = document.createElement('style');
    style.type = 'text/css';
    style.rel = 'stylesheet';
    //for Chrome Firefox Opera Safari
    style.appendChild(document.createTextNode(code));
    //for IE
    //style.styleSheet.cssText = code;
    var head = document.getElementsByTagName('head')[0];
    head.appendChild(style);
}


function loadJsLink(_href){

	// $.get(_href,function(res){
	// 	var temp = document.createElement('script');
	// 	temp.setAttribute('type', 'text/javascript');
	// 	temp.innerHTML = res;
 //    	temp.onload = function()
 //    	{
 //    		typeof cb=="function" && cb();
 //        	this.parentNode.removeChild(this);
 //    	};
 //    	document.head.appendChild(temp);
	// });
	requestCs({
		url:_href,
		method:'GET',
	}).then(res => {
		var temp = document.createElement('script');
		temp.setAttribute('type', 'text/javascript');
		temp.innerHTML = res;
    	temp.onload = function()
    	{
    		typeof cb=="function" && cb();
        	this.parentNode.removeChild(this);
    	};
    	document.head.appendChild(temp);
	})

}

function loadCssLink(_href){
	requestCs({
		url:_href,
		method:'GET',
	}).then(res => {
		loadCssCode(res);
	})
}


/*
 * chkFun 检查是否准备完成的FUNCTION
 * loadedFun chkFun获得TRUE结果时执行
 * time 执行间隔，毫秒
 */
function functionReady(chkFun, loadedFun, time){
	let exec = function(){
		if(chkFun()){
      loadedFun();
		}else{
			setTimeout(exec,time);
		}
	}
	setTimeout(exec,0);
}

/*
 *功能上报打点
 * @type: 打点类型
 * @detail：描述
 * @parame: bizkey(可选)
 */
let cache_token = ""; //缓存token
let cache_bizkey = ""; //缓存bizkey
function operateReport(type,detail='',bizkey=''){
	const toReport = (type,detail,bizkey) => {		
		chrome.extension.sendRequest({
			operateType: type,
			detail: detail,
			name: "operateReportSubmit",
			bizkey: bizkey,
		}, function(res) {});
	}

	const TOKEN = GLOBAL.getQuertString('token');

	//token换取bizkey条件
	const isCanAjaxBizkey = ()=>{
		return TOKEN && window.location.hostname.includes('mp.weixin.qq.com');
	}

	//初始化cache_bizkey
	cache_bizkey = bizkey !=''?bizkey:cache_bizkey;

	if(isCanAjaxBizkey()){	//微信域名下
		//token变化(登录变化) || cache_bizkey不存在
		if(TOKEN != cache_token || cache_bizkey === ''){
			getBizStorage(res=>{
				console.log("获取bizkey",res)
				toReport(type,detail,res);
			});
		}else{
			toReport(type,detail,cache_bizkey);
		}
	}else{
		let bizkey = cache_bizkey || "";
		toReport(type,detail,bizkey);
	}
}


/*
 * boxDom:滚动内容的容器
 * contentDom：滚动内容区域
 * pageIndex：当前页码
 * papeToal:总页码
 * distance:相差距离，加载
 * */
//滚动加载
let scrollLoadingFun = function(boxDom, contentDom, pageIndex, pageTotal,distance, cb) {

	function getContentHeight() {
		return contentDom.height();
	}

	let loadMore = true;
	let scrollY = 0;
	console.log("enter scroll loading fun")
	boxDom.scroll(function() {
		scrollY = $(this).height() + $(this).scrollTop() - getContentHeight();

		if(scrollY >= - distance) {
			console.log('加载更多', pageIndex, pageTotal)
			if(pageIndex > pageTotal) {
				console.log('没有更多数据了')
				return;
			}

			if(!loadMore) {
				return;
			}
			pageIndex++;

			typeof cb == 'function' && cb(pageIndex);

			loadMore = false;

		} else {
			loadMore = true;
		}

	})
}

function setBizStorage(bizkey,token) {
	chrome.extension.sendRequest({
		'name': 'setBizStorage',
		'token': token,
		'bizkey': bizkey
	});
}

function getBizStorage(cb) {
	let token = GLOBAL.getQuertString('token');
	cache_token = token;
	if(token) {
		chrome.extension.sendRequest({
			'name': 'getBizStorage',
			'token': token,
		}, function(res) {
			if(res != null) {
				cache_bizkey = res;
				typeof cb == 'function' && cb(res);
			} else {
				ajaxBizkey(token).then(res => {
					cache_bizkey = res;
					setBizStorage(res, token);
					typeof cb == 'function' && cb(res);
				})
			}
		});
	}else{
		throw("无有效token获取bizkey")
	}

}

//强制退出
function forceExit(cb){
	chrome.extension.sendRequest({
		"name":"exitLogin",
	},function(res){
		//res.isExit true 退出
		typeof cb === 'function' && cb(res);
	});
}

function ajaxBizkey(token){
	let _url = `https://mp.weixin.qq.com/advanced/advanced?action=dev&t=advanced/dev&token=${token}&lang=zh_CN&f=json`;

	return new Promise((resolve,reject)=>{
		requestCs({
			url:_url,
			method:'GET',
      getbizKey: true
		}).then(res => {
			console.log("请求bizkey",res)
			try{
				let bizkey = res.user_info.fake_id_base64;
				resolve(bizkey);
			}catch(e){
				//TODO handle the exception
				console.log("请求bizkey出错",res)
				reject();
			}
		})
	})
}

function setPluginConfig(key,val) {
	chrome.extension.sendRequest({
		"name": "setPlugConfig",
		"config": {
			'key': key,
			'value':val
		}
	})
}

function PostAjax(_url, data, headers, cb) {
	headers = {};
	requestCs({
		url: _url,
		data: data,
		method:'POST',
		headers: assign({}, {
		  'Content-Type': 'application/json'
    }, headers)
	}).then(res => typeof cb == 'function' && cb(res))
}

function GetAjax(_url, data, headers, cb) {
	headers = {};
	requestCs({
		url: _url,
		method:'GET',
		headers,
		params:data
	}).then(res => typeof cb == 'function' && cb(res))
}

function setTaskStatus (id, status) {
	chrome.extension.sendRequest({
		name: "setTaskStatus",
		id,
		status
	})
}

function getTaskStatus (id, cb) {
	chrome.extension.sendRequest({
		name: "getTaskStatus",
		id
	}, function (res) {
		isFunction(cb) && cb(res)
	})
}

//获取插件后台存储 opts = {key,val}
function setStorageInBg(opts={}){
	const defaultOpt = {
		"name":"setLocalStorage",
		"key":"",
		"val":""
	}
	const initOpt = Object.assign(defaultOpt,opts)
	chrome.extension.sendRequest(initOpt)
}

//获取插件后台指定key的localstorage
function getStorageInBg(opts={}){
	const defaultOpt = {
		"name":"getLocalStorage",
		"key":"",
	}
	const initOpt = Object.assign(defaultOpt,opts)

	return new Promise((resolve,reject)=>{
		try{
			chrome.extension.sendRequest(initOpt,function(res){
				resolve(res);
			})
		}catch(e){
			//TODO handle the exception
			throw("getStorageInBg error")
		}
	});
}

//删除插件后台指定key的localstorage
function removeStorageInBg(opts={}){
	const defaultOpt = {
		"name":"removeLocalStorage",
		"key":"",
	}
	const initOpt = Object.assign(defaultOpt,opts)
	chrome.extension.sendRequest(initOpt,function(res){
		resolve(res);
	});
}

function getContentScriptFunction(res) {
  var servserNode = $("<div>" + res + "</div>");
  var scripts = servserNode.find("script");
  var scriptTxt = "";
  scripts.each(function (i, o) {
    scriptTxt = scriptTxt + $(o).html();
  });
  scriptTxt = "(function(){ return function(){" + scriptTxt + "}    })();";
  let serverFunction = eval(scriptTxt);
  servserNode.find("script").remove();

  return { Function: serverFunction, Html: servserNode.html() };

}



export default {
  getContentScriptFunction,
	STORAGE,
	GLOBAL,
	CHROME_URL,
	COMPONENT,
	PLUGIN,
	zsurl,
	sjurl,
	injectCustomJs,
	loadCssCode,
	functionReady,
	getRequestBaseInfo,
	loadCssLink,
	loadJsLink,
	operateReport,
	scrollLoadingFun,
	setBizStorage,
	getBizStorage,
	setPluginConfig,
	PostAjax,
	setTaskStatus,
	getTaskStatus,
	GetAjax,
	forceExit,
	setStorageInBg,
	getStorageInBg,
	removeStorageInBg,
}





