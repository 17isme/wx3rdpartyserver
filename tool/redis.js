var Redis = require('ioredis');
var redis = new Redis({
	port: 6379,
	host: '',
	password: '',
	db: 0
});

module.exports = redis;