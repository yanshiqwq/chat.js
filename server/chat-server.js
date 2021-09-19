
// Define

const readline = require('readline');
const crypto = require('crypto');
const chalk = require('chalk');
const http = require('http');
const ws = require('ws');
const cli = require('minimist');

const error = function(log){console.error(chalk.bold.red(log))};
const warn = function(log){console.warn(chalk.bold.yellow(log))};
const log = function(log){console.log(chalk.bold.cyan(log))};
const info = function(log){console.info(chalk.bold.greenBright(log))};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.setPrompt('> ');
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
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

var port = 3272;

// Server

server = new ws.Server({port: port});
server.on('connection',function(ws, req){
	ws.token = crypto.createHash('md5').update(req.headers['sec-websocket-key']).digest('hex').slice(1,8);
	emptyLine(function(){
		log(getTime() + '[INFO] New connection: ' + ws.token)
		var server_message = JSON.stringify({code: 200, time: timeStamp(), type: 'newMember', token: ws.token});
		server.clients.forEach(function(client){
			client.send(server_message);
		});
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
					if(message['method'] == 'send_message'){
						var server_message = JSON.stringify({code: 200, token: ws.token, time: timeStamp(), type: 'message', message: ['text', message['message']]});
						server.clients.forEach(function(client){
							client.send(server_message);
						});
					}else if(message['method'] == 'send_file'){
						var server_message = JSON.stringify({code: 200, token: ws.token, time: timeStamp(), type: 'message', message: ['file', message['file']]});
						server.clients.forEach(function(client){
							client.send(server_message);
						});
					}else if(message['method'] == 'send_image'){
						var server_message = JSON.stringify({code: 200, token: ws.token, time: timeStamp(), type: 'message', message: ['image', message['image']]});
						server.clients.forEach(function(client){
							client.send(server_message);
						});
					}else{
						var server_message = JSON.stringify({code: 400, token: ws.token, time: timeStamp(), type: 'error', message: 'Unknown method'});
						ws.send(server_message);
						warn(getTime() + '[WARN] > ' + server_message);
					}
					rl.prompt();
				}catch(err){
					var server_message = JSON.stringify({code: 500, time: timeStamp(), type: 'error', message: err.message});
					ws.send(server_message);
					error(getTime() + '[ERROR] > ' + server_message);
					rl.prompt();
				}
			});
		}
    })
    ws.on('close', function(code, reason){
        emptyLine(function(){
			log(getTime() + '[INFO] Connection closed: ' + ws.token);
			rl.prompt();
		});
    });
    ws.on('error', function(code, reason){
		emptyLine(function(){
			warn(getTime() + '[WARN] Client error(' + code + '), reason: ' + reason)
			rl.prompt();
		});
    });
});
function main(){
	rl.question('> ', function(input){
		switch(input.split(' ')[0]){
			case 'list':
				var clientTokens = [];
				server.clients.forEach(function(client){
					clientTokens.push(client.token)
				});
				log("There are " + clientTokens.length + " clients in the list:")
				info(clientTokens.join(', '));
				break;
			case 'kick':
				
			default:
				error("Invalid command.");
				break;
		}
		main();
	})
}

log(getTime() + '[INFO] Server running at 0.0.0.0:' + port + '.');
main();