
// Define

const bodyParser = require('body-parser');
const svgCaptcha = require('svg-captcha');
const readline = require('readline');
const express = require('express');
const ws = require('express-ws');
const crypto = require('crypto');
const chalk = require('chalk');
const url = require('url');
const fs = require('fs');


const error = function(log){console.error(chalk.bold.red(log))};
const warn = function(log){console.warn(chalk.bold.yellow(log))};
const log = function(log){console.log(chalk.bold.cyan(log))};
const info = function(log){console.info(chalk.bold.greenBright(log))};

const emptyLine = function(callback){
	readline.clearLine(process.stdout, 0, function(){
		readline.cursorTo(process.stdout, 0, function(){
			callback();
		});
	});
	rl.prompt();
}
const timeStamp = function(){
	return new Date().getTime();
}
const uuid = function(){
	var s = [];
	var hexDigits = '0123456789abcdef';
	for(var i = 0; i < 36; i++){
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[14] = '4';
	s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
	s[8] = s[13] = s[18] = s[23] = '-';
	var uuid = s.join('');
	return uuid;
}
const getTime = function(){
	if(new Date().getHours()<10){
		var hours='0'+new Date().getHours();
	}else{
		var hours=new Date().getHours();
	}
	if(new Date().getMinutes()<10){
		var minutes='0'+new Date().getMinutes();
	}else{
		var minutes=new Date().getMinutes();
	}
	if(new Date().getSeconds()<10){
		var seconds='0'+new Date().getSeconds();
	}else{
		var seconds=new Date().getSeconds();
	}
	return '['+hours+':'+minutes+':'+seconds+'] ';
}
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
const app = express();

// Config

var port = 3272;

// Server

ws(app);
captchaList = {};
connectionList = {};
userList = {};
app.use(bodyParser.json());
app.get('/captcha/', (req, res) => {
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
	var uuid = id.slice(0,8) + '-' + id.slice(8,12) + '-' + id.slice(12,16) + '-' + id.slice(16,20) + '-' + id.slice(20,32);
	emptyLine(() => {log(getTime() + '[INFO] New captcha: ' + captcha.text + ', id: ' + id)});
	captchaList[uuid] = captcha;
	if(req.query.type){
		switch(req.query.type){
			case 'json':
				res.status(200);
				res.json({code: 200, time: timeStamp(), captcha: captcha.data, id: id});
				break;
			case 'html':
				res.send(captcha.data + '<br/>' + uuid);
				break;
			case undefined:
				res.status(200);
				res.json({code: 200, time: timeStamp(), captcha: captcha.data, id: id});
				break;
			default:
				res.status(400);
				res.json({code: 400, time: timeStamp(), message: 'Bad request'});
		}
	}
})
app.post('/register/', (req, res) => {
	try{
		var json = JSON.parse(req.body);
		if(captchaList[json.captcha[0]] == json.captcha[1]){
			delete captchaList[json.captcha[0]];
			res.status(200);
			res.json({code: 200, time: timeStamp()});
		}else{
			res.status(400);
			res.json({code: 400, time: timeStamp(), message: 'Validation failed'});
		}
	}catch(err){
		res.status(400);
		res.json({code: 400, time: timeStamp(), message: 'Bad request', error: err.message});
	}
});
app.ws('/login', function(ws, req){
	ws.token = crypto.createHash('md5').update(req.headers['sec-websocket-key']).digest('hex').slice(1,8);
	connectionList[ws.token] = ws;
	emptyLine(() => {log(getTime() + '[INFO] New connection: ' + ws.token)});
	var server_message = JSON.stringify({code: 200, time: timeStamp(), type: 'login', token: ws.token});
	ws.send(server_message);
	ws.on('message', function(raw){
		message = JSON.parse(raw);
		ws.id = message['profile'][0];
		ws.key = message['profile'][1];
		connectionList[ws.token] = ws;
		info(getTime() + ws.id + ' joined the chat room.');
		var server_message = JSON.stringify({code: 200, time: timeStamp(), type: 'userJoin', id: ws.id});
		for(var client in connectionList){
			connectionList[client].send(server_message);
		}
	});
	ws.on('close', function(code, reason){
		delete connectionList[ws.token];
		emptyLine(() => {log(getTime() + '[INFO] Connection closed: ' + ws.token + '(LOGIN)')});
	});
	ws.on('error', function(code, reason){
		emptyLine(() => {warn(getTime() + '[WARN] Client error(' + code + '), reason: ' + reason)});
	});
});
app.ws('/message', function(ws, req){
	ws.token = crypto.createHash('md5').update(req.headers['sec-websocket-key']).digest('hex').slice(1,8);
	connectionList[ws.token] = ws;
	emptyLine(() => {log(getTime() + '[INFO] New connection: ' + ws.token)});
	if(verify(req)){
		var server_message = JSON.stringify({code: 200, time: timeStamp(), type: 'login', token: ws.token});
		ws.send(server_message);
		ws.on('message', function(raw){
			var message = JSON.parse(raw);
			if(message == undefined || message == ''){
				emptyLine(() => {log(getTime() + '[INFO] < undefined')});
				var server_message = JSON.stringify({code: 400, time: timeStamp(), type: 'error', message: 'Unexpected end of message'});
				ws.send(server_message);
				emptyLine(() => {warn(getTime() + '[WARN] > ' + server_message)});
			}else{
				emptyLine(() => {
					try{
						log(getTime() + '[INFO] ' + ws.token + ' > ' + raw);
						switch(message['method']){
							case 'message':
								var server_message = JSON.stringify({code: 200, id: ws.id, time: timeStamp(), type: 'message', message: ['text', message['message']]});
								try{
									emptyLine(() => {log(getTime() + '<' + ws.id + '> ' + message['message'])});
									for(var client in connectionList){
										connectionList[client].send(server_message);
									}
								}catch(err){
									console.dir(err)
								}
								break;
							default:
								var server_message = JSON.stringify({code: 400, id: ws.id, token: ws.token, time: timeStamp(), type: 'error', message: 'Invalid method'});
								ws.send(server_message);
								emptyLine(() => {warn(getTime() + '[WARN] ' + ws.token + ' > INVALID_METHOD: ' + message['method'])});
						}
					}catch(err){
						var server_message = JSON.stringify({code: 500, time: timeStamp(), type: 'error', message: err.message});
						ws.send(server_message);
						emptyLine(() => {error(getTime() + '[ERROR] > ' + server_message)});
					}
				});
			}
		});
		ws.on('close', function(code, reason){
			delete connectionList[ws.token];
			emptyLine(() => {
				log(getTime() + '[INFO] Connection closed: ' + ws.id + '(' + ws.token + ')')
				info(getTime() + ws.id + ' left the chat room.');
			});
			var server_message = JSON.stringify({code: 200, time: timeStamp(), type: 'userQuit', id: ws.id});
			for(var client in connectionList){
				connectionList[client].send(server_message);
			}
		});
		ws.on('error', function(code, reason){
			emptyLine(() => {warn(getTime() + '[WARN] Client error(' + code + '), reason: ' + reason)});
		});
	}else{
		var server_message = JSON.stringify({code: 401, id: ws.id, token: ws.token, time: timeStamp(), type: 'error', message: 'Unauthorized'});
		ws.send(server_message);
		emptyLine(() => {warn(getTime() + '[WARN] ' + ws.token + ' > UNAUTHORIZED: ' + message['method'])});
	}
});
function verify(req){
	var ret = false;
	var params = url.parse(req.url, true).query;
	if (userList[params["id"]] == params["key"]) {
		ret = true;
	}
	return ret;	
}
function main(callback){
	rl.question('> ', function(input){
		var argv = input.split(' ')
		switch(argv[0]){
			case 'list':
				var clientTokens = [];
				for(var client in connectionList){
					clientTokens.push(client.token)
				}
				log("There are " + clientTokens.length + " clients in the list:")
				info(clientTokens.join(', '));
				break;
			case 'kick':
				try{
					connectionList[argv[1]].close();
				}catch(err){
					if(err == 'TypeError: Cannot read property \'close\' of undefined'){
						var kicked = false;
						for(var client in connectionList){
							if(client.id == argv[1]){
								client.close();
								kicked = true;
							}
						}
					}else{
						emptyLine(() => {error(getTime() + '[ERROR] Failed to close the connection "' + argv[1] + '" : ' + err)});
					}
				}
				if(kicked == false){
					emptyLine(() => {error(getTime() + '[ERROR] User or connection not exists: ' + argv[1])});
				}
				break;
			case 'stop':
				process.exit();
			case '': break;
			default:
				error(getTime() + "[ERROR] Invalid command: " + argv[0] + ".");
				break;
		}
		callback();
		main();
	});
}
log(getTime() + '[INFO] Server running at 0.0.0.0:' + port + '.');	
rl.setPrompt('> ');
app.listen(port);
rl.prompt()
main();


