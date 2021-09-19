
// Config

var server = 'ws://localhost:3272/';

// Define

const chalk = require('chalk');
const async = require('async');
const readline = require('readline');
const error = function(log){console.error(chalk.bold.red(log))};
const warn = function(log){console.warn(chalk.bold.yellow(log))};
const log = function(log){console.log(chalk.bold.cyan(log))};
const info = function(log){console.info(chalk.bold.greenBright(log))};
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.setPrompt('> ');
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
		error(gettime() + '[ERROR] Connection error: ' + err.toString());
		rl.prompt();
	});
	client.connect(server);
});
client.on('connect', function(conn){
	connection = conn;
	emptyLine(function(){
		log(gettime() + '[INFO] Successfuly connected.');
		rl.prompt();
	});
	conn.on('error', function(err) {
		emptyLine(function(){
			error(gettime() + "[ERROR] Connection error: " + err.toString());
			rl.prompt();
		});
	});
	conn.on('close', function() {
		emptyLine(function(){
			log(gettime() + '[INFO] Connection closed.');
			rl.prompt();
		});
		client.connect(server);
	});
	conn.on('message', function(message) {
		emptyLine(function(){
			messageJson = JSON.parse(message.utf8Data);
			if(messageJson['code'] == 200){
				switch(messageJson['type']){
					case 'login':
						info(gettime() + 'Successfuly login, token: ' + messageJson['token']);
						break;
					case 'message':
						log(gettime() + '<' + messageJson['token'] + '> ' + messageJson['message'][1]);
						break;
					case 'newMember':
						log(gettime() + messageJson['token'] + ' joined the chat room.');
						break;
					default:
						error(gettime() + 'Unknown message type.');
				}
			}
			rl.prompt();
		});
	});
});
function main(){
	rl.question('> ', function(input){
		var client_message = JSON.stringify({method: "send_message", message: input});
		try{
			connection.send(client_message);
		}catch(err){
			if(err == "TypeError: Cannot read property 'send' of undefined"){
				error(gettime() + "[ERROR] Not connected to any server. ");
			}else{
				error(gettime() + "[ERROR] Client error: " + err.toString());
			}
		}
		main();
	});
}
log(gettime() + '[INFO] Connecting to the server...')
client.connect(server);
main();