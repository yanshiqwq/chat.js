const utils = require('./utils');
eval(utils.console.setup);

const fs = require('fs');
const saveData = (userData, pageData, callback) => {
	var data = {
		"userData": userData,
		"pageData": pageData
	}
	fs.writeFile(lang.db.dataFile, data, (err) => {
		callback(err);
	});
}
module.exports = saveData;