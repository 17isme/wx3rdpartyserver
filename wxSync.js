let http = require('request');

// 全局变量
let AppID;
let AppSecret;

// 模型
let mVerifyTicket = require('./model/verifyTicket')
let mComponentToken = require('./model/componentToken')
let mWechatClient = require('./model/wechatClient')

// 刷新accessToken 与 jsapiTicket
let refreshTokenAndTicket = async (appID,componentToken) => {
	// 获取token对应的refreshToken
	let refreshToken = await mWechatClient.getRefreshToken(appID);
	// 获取微信公众号的accessToken
	let accessToken = await getAccessToken(AppID, componentToken, appID, refreshToken);
	// 存储accessToken
	await mWechatClient.saveAccessToken(appID, accessToken);
	// 获取JsapiTicket
	let jsapiTicket =  await getJsapiTicket(accessToken);
	// 存储jsapiTicket
	await mWechatClient.saveJsapiTicket(appID, jsapiTicket);
}

// 同步函数
var sync = async () => {
	// 获取verifyTicket
	try {
		var verifyTicket = await mVerifyTicket.get();
		console.log(verifyTicket);
	} catch (e) {
		return console.log(e);
	}
	console.log('verifyTicket done');
	// 验证verifyTicket是否过期 TODO

	// 获取componentToken 从微信服务器
	var componentToken = await getComponentToken(AppID,AppSecret,verifyTicket);

	// 存储componentToken
	mComponentToken.save(componentToken);

	// 获取已经取得授权的公众号列表
	var wechatClients = await mWechatClient.getClients();
	console.log(wechatClients);
	// 同步所有微信号的accessToken和JsapiTicket
	for (var i = wechatClients.length - 1; i >= 0; i--) {
		refreshTokenAndTicket(wechatClients[i],componentToken);
	}
}

module.exports = (appID, appSecret) => {
	AppID = appID;
	AppSecret = appSecret;
	
	sync();
	setInterval(() =>{
		sync();
	}, 6000*1000);

	return {};
};

/*
 * 获取 ComponentToken component_access_token
 *
 * appID 第三方平台ID
 * appSecret 第三方平台密钥
 * verifyTicket 所需票据信息
 *
 */
function getComponentToken(appID,appSecret,verifyTicket){
	var options = {
		url: 'https://api.weixin.qq.com/cgi-bin/component/api_component_token',
		method: 'POST',
		encoding: 'utf-8',
		body: JSON.stringify({
			"component_appid": appID,
			"component_appsecret": appSecret,
			"component_verify_ticket": verifyTicket
		}),
		timeout: 3000
	};
	return new Promise((resolve, reject) => {
		http(options,function (err, res, body) {
			console.log(body)
			if (err) {
				return reject(err);
			}
			try {
				body = JSON.parse(body);
				if (body.errcode) {
					return reject(body.errmsg);
				}
				return resolve(body.component_access_token);
			} catch (e) {
				return reject(e);
			}
		});
	});
}

/*
 * 获取 授权公众号的accessToken
 *
 * appID 第三方平台ID
 * componentToken 第三方平台accesstoken
 * wechatClientAppID 授权公众号的APPID
 * wechatClientRefreshToken 授权公众号的刷新TOKEN
 *
 */
function getAccessToken(appID, componentToken, wechatClientAppID, wechatClientRefreshToken){
	var options = {
		url: 'https://api.weixin.qq.com/cgi-bin/component/api_authorizer_token?component_access_token='+componentToken,
		method: 'POST',
		encoding: 'utf-8',
		body: JSON.stringify({
			"component_appid":appID,
			"authorizer_appid":wechatClientAppID,
			"authorizer_refresh_token":wechatClientRefreshToken
		}),
		timeout: 3000
	};
	return new Promise((resolve, reject) => {
		http(options,function (err, res, body) {
			if (err) {
				return reject(err);
			}
			try {
				body = JSON.parse(body);
				if (body.errcode) {
					return reject(body.errmsg);
				}
				return resolve(body.authorizer_access_token);
			} catch (e) {
				return reject(e);
			}
		});
	});
}

/*
 * 获取JS SDK的密钥
 *
 * token 已经授权公众号的accessToken
 *
 */
function getJsapiTicket(token){
	var options = {
		url: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token='+token+'&type=jsapi',
		method: 'GET',
		encoding: 'utf-8',
		timeout: 3000
	};
	return new Promise((resolve, reject) => {
		http(options,function (err, res, body) {
			if (err) {
				return reject(err);
			}
			try {
				body = JSON.parse(body);
				if (body.errcode) {
					return reject(body.errmsg);
				}
				return resolve(body.ticket);
			} catch (e) {
				return reject(e);
			}
		});
	});
}