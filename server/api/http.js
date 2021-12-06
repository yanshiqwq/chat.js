const utils = require('./utils');
eval(utils.console.setup);

const svgCaptcha = require('svg-captcha');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const httpApi = function(app){
	app.use(bodyParser.json());
	app.use((req, _res, next) => {
		try{
			var ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/)[0];
			emptyLine(() => {log(lang.http.log.render(ip, req.method, req.originalUrl))});
		}catch(err){
			emptyLine(() => {error(err.stack)});
		}
		next();
	});
	app.get('/captcha', (req, res) => {
		var captcha = svgCaptcha.create({
			color: config.http.color,
			inverse: config.http.false,
			width: config.http.width,
			height: config.http.height,
			fontSize: config.http.fontSize,
			size: config.http.size,
			noise: config.http.noise,
			ignoreChars: config.http.ignoreChars
		});
		if(config.http.toLowerCase){
			captcha.text = captcha.text.toLowerCase();
		}
		var id = crypto.createHash('md5').update(captcha.text).digest('hex');
		var uuid = id.slice(0, 8) + '-' + id.slice(8, 12) + '-' + id.slice(12, 16) + '-' + id.slice(16, 20) + '-' + id.slice(20, 32);
		emptyLine(() =>{log(lang.http.captcha.newCaptcha.render(captcha.text, uuid))});
		captchaList[uuid] = captcha;
		switch(req.query.type){
			case undefined:
			case 'json':
				res.status(200);
				res.set(config.http.captchaHeader.json);
				res.json({code: 200, time: timeStamp(), id: uuid, captcha: captcha.data});
				break;
			case 'html':
				res.status(200);
				res.set(config.http.captchaHeader.html);
				res.send(config.http.html(captcha.data, uuid));
				break;
			default:
				res.status(400);
				res.set(config.http.captchaHeader.default);
				res.json({code: 400, time: timeStamp(), message: lang.http.captcha.badRequest});
		}
	});
	app.post('/register', (req, res) => {
		try{
			var reqJson = req.body;
			if(reqJson.captcha[0] in captchaList){
				if(captchaList[reqJson.captcha[0]].text == reqJson.captcha[1].toLowerCase()){
					delete captchaList[reqJson.captcha[0]];
					var uid = guid();
					userList[uid] = {id: reqJson.id, key: reqJson.key};
					res.status(200);
					res.json({code: 200, time: timeStamp(), uid: uid});
					emptyLine(() =>{info(lang.http.register.newUser.render(reqJson.id, uid, reqJson.key))});
				}else{
					res.status(400);
					res.json({code: 400, time: timeStamp(), message: lang.http.register.validationFailed});
				}
			}else{
				res.status(400);
				res.json({code: 400, time: timeStamp(), message: lang.http.register.invalidCaptcha});
			}
		}catch(err){
			res.status(400);
			res.json({code: 400, time: timeStamp(), message: lang.http.register.badRequest, error: err.stack});
		}
	});
}
module.exports = httpApi;