var redis = require('../tool/redis');

module.exports = {
	save:(componentToken) => {
		console.log('正在存储');
		return new Promise((resolve, reject) => {
			redis.set('componentToken',componentToken, function(e){
				console.log(e);
				if (e) {
					return reject(e);
				}
				return resolve(componentToken);
			});
		});
	},
	get:() => {
		return new Promise((resolve, reject) => {
			redis.get('componentToken', function(e, componentToken){
				if (e) {
					return reject(e);
				}
				return resolve(componentToken);
			});
		});
	}
};