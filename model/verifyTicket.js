var redis = require('../tool/redis');

module.exports = {
	save:(verifyTicket) => {
		return new Promise((resolve, reject) => {
			redis.set('verifyTicket',verifyTicket, function(e){
				if (e) {
					return reject(e);
				}
				return resolve(verifyTicket);
			});
		});
	},
	get:() => {
		return new Promise((resolve, reject) => {
			redis.get('verifyTicket', function(e, verifyTicket){
				if (e) {
					return reject(e);
				}
				return resolve(verifyTicket);
			});
		});
	}
};