const utils = require('./utils');
eval(utils.console.setup);

const svgCaptcha = require('svg-captcha');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const httpApi = function(app){
	app.use(bodyParser.json());
	app.use((req, _res, next) => {
		emptyLine(() => {log(lang.http.log.render(req.ip.match(/\d+\.\d+\.\d+\.\d+/)[0], req.method, req.originalUrl))});
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
		emptyLine(() =>{log(lang.http.captcha.newCaptcha.render(captcha.text, id))});
		captchaList[uuid] = captcha;
		switch(req.query.type){
			case undefined:
			case 'json':
				res.writeHead(200, config.http.captchaHeader.json);
				res.json({code: 200, time: timeStamp(), captcha: captcha.data, id: uuid});
				break;
			case 'html':
				res.writeHead(200, config.http.captchaHeader.html);
				res.send(config.http.html(captcha.data, uuid));
				break;
			default:
				res.writeHead(400, config.http.captchaHeader.default);
				res.json({code: 400, time: timeStamp(), message: lang.http.captcha.badRequest});
		}
	});
	app.post('/register', (req, res) => {
		try{
			var reqJson = JSON.parse(req.body);
			if(captchaList[reqJson.captcha[0]] == reqJson.captcha[1]){
				delete captchaList[reqJson.captcha[0]];
				userList[reqJson.id] = reqJson.key;
				res.status(200);
				res.json({code: 200, time: timeStamp()});
			}else{
				res.status(400);
				res.json({code: 400, time: timeStamp(), message: lang.http.register.validationFailed});
			}
		}catch(err){
			res.status(400);
			res.json({code: 400, time: timeStamp(), message: lang.http.register.badRequest, error: err.message});
		}
	});
	app.post('/login', (req, res) => {
		var token = guid();
		emptyLine(() =>{log(lang.http.login.newRequest.render(token))});
		try{
			console.dir(req.post);
			message = JSON.parse(req.body);
			userList[token] ={
				'id': message['profile'][0],
				'key': message['profile'][1]
			};
			res.status(200);
			var message = {code: 200, time: timeStamp(), type: 'login', token: token, maxAge: 60};
			res.json(JSON.stringify(message));
			emptyLine(() => {log(JSON.stringify(message))});
		}catch(err){
			res.status(400);
			var message = {code: 400, time: timeStamp(), type: 'login', token: token, message: err.message};
			res.json(JSON.stringify(message));
			emptyLine(() => {warn(lang.http.login.loginError.render(token, JSON.stringify(message)))});
		}
	});
}
module.exports = httpApi;