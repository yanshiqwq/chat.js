/**
 * @file page.js 保存页面
 * @author 延时qwq <yanshiqwq@126.com>
 * @version v1.4.1
 */

const utils = require('./utils');
eval(utils.console.setup);

const url = require('url');
async function savePage(pageUrl){
	const userAgents = [
		'Mozilla/5.0 (Windows NT 10; Win64; x64; rv:83.0) Gecko/20100101 Firefox/83.0'
	];
	var userAgent = userAgents[parseInt(Math.random() * userAgents.length)];
	var res = await getPromise(pageUrl, {headers: {'User-Agent': userAgent}});
	while(res.statusCode in [301, 302, 303, 307]){
		var link = res.headers['Location'];
		var res = await getPromise(link, {headers: {'User-Agent': userAgent}});
	}
	$ = cheerio.load(res.body);
	var linkRaw = [];
	var links = [];
	var jsObjects = $("script").filter("src");
	var cssObjects = $("link").filter("href");
	var backImgObjects = $("div").filter("style*=background-image");
	for(var index in jsObjects){
		if(util.isObject(jsObjects[index]) && "attrib" in jsObjects[index]){
			linkRaw.push(jsObjects[index].attrib.src);
		}
	}
	for(var index in cssObjects){
		linkRaw.push(cssObjects[index].attrib.href);
	}
	for(var index in backImgObjects){
		linkRaw.push(backImgObjects[index].attrib.style.match(/(?<=background-image:[\s]+).+?(?=;)/)[0]);
	}
	console.dir(linkRaw)
	for(var index in linkObjects){
		var link = linkObjects[index].attribs.href;
		if(link.substr(0,1) != "#"){
			if(link.substr(0,2) == "//"){
				link = url.parse(pageUrl).protocol + link;
			}
			if(this.testUrl(link)){
				links.push(link);
			}
		}
	}
	return links;
}

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
					res.json({code: 500, time: timeStamp(), id: pageId, error: err.stack});
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
					emptyLine(() => {warn(lang.page.savePage.failedSavingArchive.render(url, pageId, err.stack))});
					res.status(500);
					res.json({code: 500, time: timeStamp(), id: pageId, error: err.stack});
				}
			}
		}else{
			res.status(400);
			res.json({code: 400, time: timeStamp(), id: pageId, error: lang.page.savePage.invalidUrl});
		}
	});
}
module.exports = pageApi;