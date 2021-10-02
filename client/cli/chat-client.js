
// Config

var server = 'ws://localhost:3272/';

// Define

const http = require('http');
const chalk = require('chalk');
const readline = require('readline');
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
var wsc = require('websocket').client;
var client = new wsc();
const gettime = function(){
	if(new Date().getHours()<10){
		var hours="0"+new Date().getHours();
	}else{
		var hours=new Date().getHours();
	}
	if(new Date().getMinutes()<10){
		var minutes="0"+new Date().getMinutes();
	}else{
		var minutes=new Date().getMinutes();
	}
	if(new Date().getSeconds()<10){
		var seconds="0"+new Date().getSeconds();
	}else{
		var seconds=new Date().getSeconds();
	}
	return "["+hours+":"+minutes+":"+seconds+"] ";
}

// Client

var connection;
client.on('connectFailed', function(err){
	emptyLine(function(){
		if(err == 'Error: Server responded with a non-101 status: 401 Unauthorized\n' + 'Response Headers Follow:\n' + 'connection: close\n' + 'content-type: text/html\n' + 'content-length: 12\n'){
			error(gettime() + '[USER] User unauthorized.');
			process.exit();
		}else{
			error(gettime() + '[CONN] Connection error: ' + err.toString());
		}
		log(gettime() + '[CONN] Reconnecting to the server...');
		rl.prompt();
	});
	reconnectTimer = setTimeout(function(){
		client.connect(server + '?id=' + userProfile[0] + '&key=' + userProfile[1]);
	}, 3000);
});
client.on('connect', function(conn){
	connection = conn;
	emptyLine(function(){
		log(gettime() + '[CONN] Successfuly connected.');
		rl.prompt();
	});
	conn.on('error', function(err) {
		emptyLine(function(){
			error(gettime() + "[CONN] Connection error: " + err.toString());
			rl.prompt();
		});
		client.connect(server + '?id=' + user + '&key=' + pass);
	});
	conn.on('close', function() {
		emptyLine(function(){
			log(gettime() + '[CONN] Connection closed.');
			rl.prompt();
		});
	});
	conn.on('message', function(message) {
		emptyLine(function(){
			messageJson = JSON.parse(message.utf8Data);
			if(messageJson['code'] == 200){
				switch(messageJson['type']){
					case 'login':
						info(gettime() + '[USER] Successfuly login, token: ' + messageJson['token']);
						var client_message = JSON.stringify({method: "login", profile: userProfile});
						conn.send(client_message);
						break;
					case 'message':
						log(gettime() + '[CHAT] <' + messageJson['id'] + '> ' + messageJson['message'][1]);
						break;
					case 'userJoin':
						log(gettime() + '[CHAT] ' + messageJson['id'] + ' joined the chat room.');
						break;
					case 'userLeft':
						log(gettime() + '[CHAT] ' + messageJson['id'] + ' left the chat room.');
						break;
					default:
						error(gettime() + '[CHAT] Unknown message type.');
				}
			}
			rl.prompt();
		});
	});
});
function main(){
	rl.question('> ', function(input){
		var argv = input.split(' ')
		switch(argv[0]){
			case 'stop':
				try{
					clearTimeout(reconnectTimer);
					emptyLine(function(){
						log(gettime() + "[CONN] Stopped reconnecting.");
						rl.prompt();
					});
				}catch(err){
					error(gettime() + "[CONN] " + err);
				}
			case 'eval':
				try{
					eval(input.slice(5));
				}catch(err){
					error(gettime() + "[EVAL] " + err);
				}
				break;
			case 'send':
				try{
					if(argv[1] == undefined | argv[1] == ''){
						error(gettime() + "[CHAT] Message cannot be null. ");
					}else{
						var client_message = JSON.stringify({method: "message", message: input.slice(5)});
						connection.send(client_message);
					}
				}catch(err){
					if(err == "TypeError: Cannot read property 'send' of undefined"){
						error(gettime() + "[CHAT] Not connected to any server. ");
					}else{
						error(gettime() + "[CHAT] Client error: " + err.toString());
					}
				}
				break;
			default:
				error(gettime() + "[CHAT] Invalid command.");
		}
		main();
	});
}
var userProfile = []
rl.question(chalk.bold.cyan(gettime() + '[USER] Username > '), function(user){
	rl.question(chalk.bold.cyan(gettime() + '[USER] Password > '), function(pass){
		rl.setPrompt('> ');
		log(gettime() + '[CONN] Connecting to the server...')
		client.connect(server + '?id=' + user + '&key=' + pass);
		userProfile = [user, pass];
		main();
	});
});