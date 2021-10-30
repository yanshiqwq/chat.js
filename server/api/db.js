const fs = require('fs');
const saveData = (userData, pageData, callback) => {
	var data = {
		"userData": userData,
		"pageData": pageData
	}
	fs.writeFile("data.json", data, (err) => {
		callback(err);
	});
}
module.exports = saveData;