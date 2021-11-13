const utils = require('./utils');
eval(utils.console.setup);

const crypto = require('crypto');
const pageApi = function(app){
	app.get('/page/:id', (req, res) => {
		var pageId = req.params.id;
		if(pageId){
			if(pageId in pageList){
				try{
					var pageData = pageList[pageId];
					res.writeHead(200, config.page.pageHeader);
					res.end(pageData);
				}catch(err){
					res.status(500);
					res.json({code: 500, time: timeStamp(), id: pageId, error: err.message});
				}
			}else{
				res.status(404);
				res.json({code: 404, time: timeStamp(), id: pageId});
			}
		}else{
			res.status(400);
			res.json({code: 400, time: timeStamp(), id: pageId, error: lang.page.queryPage.invalidPageId});
		}
	});
	app.get('/savePage', async (req, res) => {
		var url = req.query.url;
		if(testUrl(url)){
			var pageId = crypto.createHash(config.page.pageIdGenerator).update(url).digest('hex');
			if(pageId in pageList){
				res.status(200);
				res.json({code: 200, time: timeStamp(), id: pageId, exist: true});
			}else{
				emptyLine(() => {log(lang.page.savePage.newArchive.render(url, pageId))});
				try{
					pageList[pageId] = await savePage(url);
					emptyLine(() => {log(lang.page.savePage.savedArchive.render(url, pageId))});
					res.status(200);
					res.json({code: 200, time: timeStamp(), id: pageId, exist: false});
				}catch(err){
					emptyLine(() => {warn(lang.page.savePage.failedSavingArchive.render(url, pageId, err.message))});
					res.status(500);
					res.json({code: 500, time: timeStamp(), id: pageId, error: err.message});
				}
			}
		}else{
			res.status(400);
			res.json({code: 400, time: timeStamp(), id: pageId, error: lang.page.savePage.invalidUrl});
		}
	});
}
module.exports = pageApi;