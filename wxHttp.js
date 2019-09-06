/*
	提供微信第三方平台的http服务
*/

// 公共变量
let AppID
let AppSecret

const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser')
const xmlParser = require('koa-xml-body')
const router = require('koa-router')()
const http = require('request')

// 模型
let mVerifyTicket = require('./model/verifyTicket')
let mComponentToken = require('./model/componentToken')
let mWechatClient = require('./model/wechatClient')

// 微信加密处理
let wxCrypto = require('./tool/wxCrypto');

// xml处理
const xml2js = require('xml2js');
let xmlFmter = xml2js.parseString;
// var xmlParser = ;
const xmlFmt = function(str){
	return new Promise((resolve, reject) => {
		xmlFmter(str, {explicitArray : false}, function (err, result) {
			if (err) {
				return reject(err);
			}
			return resolve(result);
		})
	})
}

app.use(xmlParser())
app.use(bodyParser())
// 微信自动解密
// app.use(async (ctx, next) => {
// 	let data = ctx.request.body.xml;
// 	if (!data) {
// 		return next();
// 	}
// 	let encrypt = data['Encrypt'][0];
// 	let msg = wxCrypto.decrypt(encrypt);
// 	ctx.wxMsg = xmlFmt(msg.message);
// 	next();
// })
// router.get('/index.html', async (ctx, next) => {
//     ctx.body = "<iframe src='http://www.baidu.com'></iframe>";
// })

// 授权页面
router.get('/auth.html', async (ctx, next) => {
    // 若已经获得授权码
	var authCode = ctx.query.auth_code;
	// 获取第三方平台token
	var componentToken = await mComponentToken.get();
	// 授权完毕
	if (authCode) {
		// 获取授权公众号的信息
		let info = await getWechatClientInfo(AppID, authCode, componentToken);
		// 存储授权公众号
		mWechatClient.save({
			'app_id':info['authorizer_appid'],
			'authorizer_refresh_token':info['authorizer_refresh_token'],
			'access_token':info['authorizer_access_token']
		});

		ctx.body = "<h1>授权成功</h1>";

	// 准备授权
	}else{
		let code = await preAuthCode(AppID, componentToken);
		let callbackUrl = ctx.href;
		var url = 'https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid='+AppID+'&pre_auth_code='+code+'&redirect_uri='+callbackUrl;
		// ctx.response.redirect(url);
		ctx.body = "<iframe src='"+url+"' style='width:100%;height:100%;'></iframe>";
	}
})

// 授权事件接收接口
router.post('/auth.api', async (ctx, next) => {
	console.log(ctx.request.body);
	if (!ctx.request.body) {
		return console.log("微信第三方平台消息接口收到了错误的信息");
	}
	let data = ctx.request.body.xml;
	// 消息解密
	let encrypt = data['Encrypt'][0];
	let msg = wxCrypto.decrypt(encrypt);
	console.log(msg);
	// xml 转换
	msg = await xmlFmt(msg.message);
	switch(msg.xml.InfoType){
		// verify_ticket 同步
		case 'component_verify_ticket':
			await mVerifyTicket.save(msg.xml.ComponentVerifyTicket);
			break;

		// 授权信息
		case 'authorized':
			// // 获取第三方平台token
			// var componentToken = await mWxOpen.componentToken.get();
			// // 获取授权公众号的信息
			// var info = await getWechatClientInfo(AppID, result['xml']['AuthorizationCode'], componentToken);
			// // 存储授权公众号
			// mWxOpen.wechat.set({
			// 	'app_id':info['authorizer_appid'],
			// 	'authorizer_refresh_token':info['authorizer_refresh_token']
			// });
			// // 存储对应的accessToken TODO
			// mWxOpen[ info['authorizer_appid'] ]['access_token'] = info['authorizer_access_token'];
			break;

		default:
	}
	ctx.body = "success";
})

// 微信号消息接口
router.post('/:appID/msg.api', async (ctx, next) => {
	let data = ctx.request.body.xml
	console.log("okok");
	console.log(data);
	// 消息解密
	let encrypt = data['Encrypt'][0]
	let msg = wxCrypto.decrypt(encrypt)
	// xml 转换
	msg = await xmlFmt(msg.message)
	// 
	console.log(msg)
})
// 错误处理
app.on('error', err => {
	console.log(err)
});

app.use(router.routes(), router.allowedMethods())

module.exports = (appID, appSecret) => {
	AppID = appID
	AppSecret = appSecret
	app.listen(80)
	return {}
}

/*
 * 获取 授权公众号的详细信息
 *
 * componentToken 第三方平台accesstoken
 * appID 第三方平台ID
 * authCode 授权公众号的授权码
 *
 */
function getWechatClientInfo(appID, authCode, componentToken){
	var options = {
		url: 'https://api.weixin.qq.com/cgi-bin/component/api_query_auth?component_access_token='+componentToken,
		method: 'POST',
		encoding: 'utf-8',
		body: JSON.stringify({
			"component_appid": appID,
			"authorization_code": authCode
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
				return resolve(body.authorization_info);
			} catch (e) {
				return reject(e);
			}
		});
	});
}

/*
 * 获取预授权码 pre_auth_code
 *
 * appID 第三方平台ID
 * componentToken 第三方平台accesstoken
 *
 */
function preAuthCode(appID, componentToken){
	var options = {
		url: 'https://api.weixin.qq.com/cgi-bin/component/api_create_preauthcode?component_access_token='+componentToken,
		method: 'POST',
		encoding: 'utf-8',
		body: JSON.stringify({
			"component_appid": appID
		}),
		timeout: 3000
	};
	return new Promise((resolve, reject) => {
		http(options,function (err, res, body) {
			console.log(body);
			if (err) {
				return reject(err);
			}
			try {
				body = JSON.parse(body);
				if (body.errcode) {
					return reject(body.errmsg);
				}
				return resolve(body.pre_auth_code);
			} catch (e) {
				return reject(e);
			}
		});
	});
}
