const utils = require('./utils');
const svgCaptcha = require('svg-captcha');
const bodyParser = require('body-parser');
const crypto = require('crypto');
eval(utils.console.setup);
const httpApi = (app) => {
	app.use(bodyParser.json());
	app.use((req, res, next) => {
		emptyLine(() => {log(`${req.ip.match(/\d+\.\d+\.\d+\.\d+/)} > ${req.method} "${req.originalUrl}"`)});
		next();
	});
	app.get('/captcha', (req, res) => {
		var captcha = svgCaptcha.create({
			color: true,
			inverse: false,
			width: 100,
			height: 40,
			fontSize: 48,
			size: 4,
			noise: 3,
			ignoreChars: '0oO1ilI'
		});
		captcha.text = captcha.text.toLowerCase();
		var id = crypto.createHash('md5').update(captcha.text).digest('hex');
		var uuid = id.slice(0, 8) + '-' + id.slice(8, 12) + '-' + id.slice(12, 16) + '-' + id.slice(16, 20) + '-' + id.slice(20, 32);
		emptyLine(() =>{log(`New captcha: ${captcha.text}, id: ${id}`)});
		captchaList[uuid] = captcha;
		switch(req.query.type){
			case 'json':
				res.status(200);
				res.json({code: 200, time: timeStamp(), captcha: captcha.data, id: uuid});
				break;
			case 'html':
				res.send(captcha.data + '<br/>' + uuid);
				break;
			case undefined:
				res.status(200);
				res.json({code: 200, time: timeStamp(), captcha: captcha.data, id: uuid});
				break;
			default:
				res.status(400);
				res.json({code: 400, time: timeStamp(), message: 'Bad request'});
		}
	});
	app.post('/register', (req, res) => {
		try{
			var reqJson = JSON.parse(req.body);
			if (captchaList[reqJson.captcha[0]] == reqJson.captcha[1]){
				delete captchaList[reqJson.captcha[0]];
				userList[reqJson.id] = reqJson.key;
				res.status(200);
				res.json({code: 200, time: timeStamp()});
			}else{
				res.status(400);
				res.json({code: 400, time: timeStamp(), message: 'Validation failed'});
			}
		}catch (err){
			res.status(400);
			res.json({code: 400, time: timeStamp(), message: 'Bad request', error: err.message});
		}
	});
	app.post('/login', (req, res) => {
		var token = guid();
		emptyLine(() =>{log(`New request: ${token}`)});
		try{
			console.dir(req.post);
			message = JSON.parse(req.body);
			userList[token] ={
				'id': message['profile'][0],
				'key': message['profile'][1]
			};
			res.status(200);
			var message ={code: 200, time: timeStamp(), type: 'login', token: token, maxAge: 60};
			res.json(JSON.stringify(message));
			emptyLine(() =>{log(JSON.stringify(message));});
		}catch (err){
			res.status(400);
			var message ={code: 400, time: timeStamp(), type: 'login', token: token, message: err.message};
			res.json(JSON.stringify(message));
			emptyLine(() =>{warn(`[${token}] ${JSON.stringify(message)}`)});
		}
	});
}
module.exports = httpApi;