let xml2js = require('xml2js');
let xmlFmter = xml2js.parseString;
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

module.exports = xmlFmt;