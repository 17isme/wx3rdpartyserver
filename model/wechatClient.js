var redis = require('../tool/redis');

module.exports = {
	save:({app_id:appID,authorizer_refresh_token:refreshToken,access_token:accessToken}) => {
		redis.hmset('client-'+appID,{'refreshToken':refreshToken,'accessToken':accessToken})
	},
	get:(appID,field) => {
		return new Promise((resolve, reject) => {
			redis.hmget(appID, field, function(e, result){
				if (e) {
					return reject(e);
				}
				return resolve(result);
			});
		});
	},
	getClientInfo:(appID) => {
		return new Promise((resolve, reject) => {
			redis.hgetall('client-'+appID, function(e, result){
				if (e) {
					return reject(e);
				}
				return resolve(result);
			});
		});
	},
	getRefreshToken:(appID) => {
		return new Promise((resolve, reject) => {
			redis.hget('client-'+appID, 'refreshToken', function(err, refreshToken){
				if (err) {
					return reject(e);
				}
				return resolve(refreshToken);
			});
		});
	},
	getClients:() => {
		return new Promise((resolve, reject) => {
			redis.keys('client-*', function(e, result){
				if (e) {
					return reject(e);
				}
				for (var i = result.length - 1; i >= 0; i--) {
					result[i] = result[i].replace('client-','');
				}
				return resolve(result);
			});
		});
	},
	saveAccessToken:(appID,accessToken) => {
		return new Promise((resolve, reject) => {
			redis.hset('client-'+appID, 'accessToken', accessToken, function(e, result){
				if (e) {
					return reject(e);
				}
				return resolve(result);
			});
		});
	},
	saveJsapiTicket:(appID,jsapiTicket) => {
		return new Promise((resolve, reject) => {
			redis.hset('client-'+appID, 'jsapiTicket', jsapiTicket, function(e, result){
				if (e) {
					return reject(e);
				}
				return resolve(result);
			});
		});
	}
};