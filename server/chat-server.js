
// Define

const cookieParser = require('cookie-parser');
const svgCaptcha = require('svg-captcha');
const readline = require('readline');
const express = require('express');
const crypto = require('crypto');
const chalk = require('chalk');
const http = require('http');
const url = require('url')
const ws = require('ws');
const app = express();

const error = function(log){console.error(chalk.bold.red(log))};
const warn = function(log){console.warn(chalk.bold.yellow(log))};
const log = function(log){console.log(chalk.bold.cyan(log))};
const info = function(log){console.info(chalk.bold.greenBright(log))};
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const emptyLine = function(callback){
	readline.clearLine(process.stdout, 0, function(){
		readline.cursorTo(process.stdout, 0, function(){
			callback();
		});
	});
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

// Config

var wsPort = 3272;
var httpPort = 3273;

// Server

rl.setPrompt('> ');
captchaList = {};
connectionList = {};
app.use(cookieParser());
app.get('/captcha',(req,res)=>{
	var uuid = uuid();
    var captcha = svgCaptcha.create({
        color: true,
        inverse:false,
        width: 100,
        height: 40,
        fontSize: 48,
        size: 4,
        noise: 3,
        ignoreChars: '0oO1ilI'
    });
    captcha.text.toLowerCase();
    emptyLine(function(){log(getTime() + '[INFO] New captcha: ' + captcha.text)});
    res.json({captcha: captcha.data, id: uuid});
    captchaList[uuid] = captcha;
})
app.post('/register', function(req, res){
	if(req.body.id & req.body.key & req.body.captcha){
		if(captchaList[req.body.captcha[0]] == req.body.captcha[1]){
			var json = {code: 200, time: timeStamp()};
			res.json(json);
		}else{
			var json = {code: 400, time: timeStamp(), message: 'Validation failed'};
			res.json(json);
		}
	}else{
		var json = {code: 400, time: timeStamp(), message: 'Bad request'};
		res.json(json);
	}
	res.json
});
app.listen(httpPort);

wss = new ws.Server({port: wsPort, verifyClient: verify});
wss.on('connection', function(ws, req){
	ws.token = crypto.createHash('md5').update(req.headers['sec-websocket-key']).digest('hex').slice(1,8);
	connectionList[ws.token] = ws;
	emptyLine(function(){
		log(getTime() + '[INFO] New connection: ' + ws.token);
		rl.prompt();
	});
	var server_message = JSON.stringify({code: 200, time: timeStamp(), type: 'login', token: ws.token});
	ws.send(server_message);
	ws.on('message', function(raw){
		var message = JSON.parse(raw);
		if(message == undefined || message == ''){
			log(getTime() + '[INFO] < undefined');
			var server_message = JSON.stringify({code: 400, time: timeStamp(), type: 'error', message: 'Unexpected end of message'});
			ws.send(server_message);
			warn(getTime() + '[WARN] > ' + server_message);
		}else{
			emptyLine(function(){
				try{
					log(getTime() + '[INFO] ' + ws.token + ' > ' + raw);
					switch(message['method']){
						case 'login':
							ws.id = message['profile'][0];
							ws.key = message['profile'][1];
							connectionList[ws.token] = ws;
							info(getTime() + ws.id + ' joined the chat room.');
							var server_message = JSON.stringify({code: 200, time: timeStamp(), type: 'userJoin', id: ws.id});
							wss.clients.forEach(function(client){
								client.send(server_message);
							});
							break;
						case 'message':
							var server_message = JSON.stringify({code: 200, id: ws.id, time: timeStamp(), type: 'message', message: ['text', message['message']]});
							try{
								log(getTime() + '<' + ws.id + '> ' + message['message']);
								wss.clients.forEach(function(client){
									client.send(server_message);
								});
							}catch(err){
								console.dir(err)
							}
							break;
						default:
							var server_message = JSON.stringify({code: 400, id: ws.id, token: ws.token, time: timeStamp(), type: 'error', message: 'Invalid method'});
							ws.send(server_message);
							warn(getTime() + '[WARN] ' + ws.token + ' > INVALID_METHOD: ' + message['method']);
					}
					rl.prompt();
				}catch(err){
					var server_message = JSON.stringify({code: 500, time: timeStamp(), type: 'error', message: err.message});
					ws.send(server_message);
					emptyLine(function(){
						error(getTime() + '[ERROR] > ' + server_message);
					});
					rl.prompt();
				}
			});
		}
    })
    ws.on('close', function(code, reason){
		delete connectionList[ws.token];
        emptyLine(function(){
			log(getTime() + '[INFO] Connection closed: ' + ws.token);
			try{
				info(getTime() + ws.id + ' left the chat room.');
			}catch(err){
				console.dir(err);
			}
			rl.prompt();
		});
		var server_message = JSON.stringify({code: 200, time: timeStamp(), type: 'userQuit', id: ws.id});
		wss.clients.forEach(function(client){
			client.send(server_message);
		});		
    });
    ws.on('error', function(code, reason){
		emptyLine(function(){
			warn(getTime() + '[WARN] Client error(' + code + '), reason: ' + reason)
			rl.prompt();
		});
    });
});
function verify(info){
	var ret = false;
    var params = url.parse(info.req.url, true).query;
    if (params["id"] == "yanshiqwq" && params["key"] == "minecraft666") {
        ret = true;
    }
    return ret;  
}
function main(){
	rl.question('> ', function(input){
		var argv = input.split(' ')
		switch(argv[0]){
			case 'list':
				var clientTokens = [];
				wss.clients.forEach(function(client){
					clientTokens.push(client.token)
				});
				log("There are " + clientTokens.length + " clients in the list:")
				info(clientTokens.join(', '));
				break;
			case 'kick':
				try{
					connectionList[argv[1]].close();
				}catch(err){
					if(err == 'TypeError: Cannot read property \'close\' of undefined'){
						var kicked = false;
						wss.clients.forEach(function(client){
							if(client.id == argv[1]){
								client.close();
								kicked = true;
							}
						});
					}else{
						emptyLine(function(){
							error(getTime() + '[ERROR] Failed to close connection ' + argv[1] + ' : ' + err);
							rl.prompt();
						});
					}
				}
				if(kicked == false){
					emptyLine(function(){
						error(getTime() + '[ERROR] User or connection not exists: ' + argv[1]);
						rl.prompt();
					});
				}
				break;
			case 'stop':
				process.exit();
			default:
				error(getTime() + "[ERROR] Invalid command.");
				break;
		}
		main();
	})
}

log(getTime() + '[INFO] Server running at 0.0.0.0:' + wsPort + '.');
main();