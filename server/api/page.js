const crypto = require('crypto');
const utils = require('./utils');
eval(utils.console.setup);
const pageApi = (app) => {
	app.get('/pages/:id', (req, res) => {
		try{
			var pageId = req.params.id.match(/[0-9|a-f]{64,64}(?=\.(mht(ml)?)?)/)[0];
		}catch(e){
			var pageId = req.params.id.match(/[0-9|a-f]{64,64}(?=\.(mht(ml)?)?)/);
		}
		if(pageId){
			if(pageId in pageList){
				queryPage(pageId, function(err, pageData){
					if(err){
						res.status(500);
						res.json({code: 500, time: timeStamp(), id: pageId, error: err});
					}else{
						res.writeHead(200, {"Content-Type": "multipart/related"});
						res.end(pageData.toString());
					}
				});
			}else{
				res.status(404);
				res.json({code: 404, time: timeStamp(), id: pageId});
			}
		}else{
			res.status(400);
			res.json({code: 400, time: timeStamp(), id: pageId, error: "Invalid pageId"});
		}
	});
	app.get('/savePage', async (req, res) => {
		var url = req.query.url;
		if(testUrl(url)){
			var pageId = crypto.createHash('sha256').update(url).digest('hex');
			if(pageId in pageList){
				res.status(200);
				res.json({code: 200, time: timeStamp(), id: pageId, exist: true});
			}else{
				new Promise(() => {
					emptyLine(() => {log(`New archive: ${url}, id: ${pageId}`)});
				}).then(() => {
					savePage(url, function(err, pageData){
						if(err){
							emptyLine(() => {warn(`Failed to save archive: ${url}, id: ${pageId}, err: ${err}`)});
							res.status(500);
							res.json({code: 500, time: timeStamp(), id: pageId, error: err});
						}else{
							pageList[pageId] = pageData.toString('base64');
							emptyLine(() => {log(`Successfully saved archive: ${url}, id: ${pageId}`)});
							res.status(200);
							res.json({code: 200, time: timeStamp(), id: pageId, exist: false});
						};
					});
				});
			}
		}else{
			res.status(400);
			res.json({code: 400, time: timeStamp(), id: pageId, error: "Invalid url"});
		}
	});
}
module.exports = pageApi;