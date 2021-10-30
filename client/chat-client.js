
// Config

var host = 'localhost';
var port = 3272;

// Define

const http = require('http');
const readline = require('readline');
const chalk = require('chalk');

const error = function(log){console.error(chalk.bold.red(log))};
const warn = function(log){console.warn(chalk.bold.yellow(log))};
const log = function(log){console.log(chalk.bold.cyan(log))};
const info = function(log){console.info(chalk.bold.greenBright(log))};

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
const emptyLine = async function(callback){
	await readline.clearLine(process.stdout, 0, function(){
		readline.cursorTo(process.stdout, 0, function(){
			callback();
		});
	});
	rl.prompt();
}
const getTime = function(){
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
const login = function(host, port, id, key){
	var req = http.request({
		hostname: host,
		port: port,
		path: '/login',
		method: 'POST',
		headers: {
			'Content-Type': 'text/json'
		}
	}, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (raw) {
			var data = JSON.parse(JSON.parse(raw));
			if(data.code != 200){
				emptyLine(() => {error(getTime() + "[ERROR] Login failed: " + data.message)});
			}
		});
	});
	req.write(JSON.stringify({
		'id': id,
		'key': key
	}));
	req.on("error", function(err){
		console.log(err.message);
	});
}

// Client

var connection;
var wsc = require('websocket').client;
var client = new wsc();
/*loginClient.on('connectFailed', function(err){
	emptyLine(function(){
		log(getTime() + '[INFO] Reconnecting to the server...');
		rl.prompt();
	});
	reconnectTimer = setTimeout(function(){
		loginClient.connect(server + '/login?id=' + user[0] + '&key=' + user[1]);
	}, 3000);
});
loginClient.on('connect', function(conn){
	conn.on('message', function(message) {
		emptyLine(function(){
			messageJson = JSON.parse(message.utf8Data);
			if(messageJson['code'] == 200){
				emptyLine(function(){
					log(getTime() + '[INFO] Successfuly login, got process token: ' + messageJson['token'] + '.');
					rl.prompt();
				});
			}
			rl.prompt();
		});
	});
});*/
client.on('connect', function(conn){
	connection = conn;
	emptyLine(function(){
		log(getTime() + '[INFO] Successfuly connected.');
		rl.prompt();
	});
	conn.on('error', function(err) {
		emptyLine(function(){
			error(getTime() + "[ERROR] Connection error: " + err.toString());
			rl.prompt();
		});
	});
	conn.on('close', function() {
		emptyLine(function(){
			log(getTime() + '[INFO] Connection closed.');
			rl.prompt();
		});
	});
	conn.on('message', function(message) {
		emptyLine(function(){
			messageJson = JSON.parse(message.utf8Data);
			if(messageJson['code'] == 200){
				switch(messageJson['type']){
					case 'login':
						info(getTime() + '[INFO] Successfuly login, token: ' + messageJson['token']);
						var client_message = JSON.stringify({method: "login", profile: user});
						conn.send(client_message);
						break;
					case 'message':
						log(getTime() + '[INFO] <' + messageJson['id'] + '> ' + messageJson['message'][1]);
						break;
					case 'userJoin':
						log(getTime() + '[INFO] ' + messageJson['id'] + ' joined the chat room.');
						break;
					case 'userLeft':
						log(getTime() + '[INFO] ' + messageJson['id'] + ' left the chat room.');
						break;
					default:
						error(getTime() + '[INFO] Unknown message type.');
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
			case 'conn':
				try{
					login(host, port, user[0], user[1]);
				}catch(err){
					error(getTime() + "[ERROR] " + err);
				}
				break;
			case 'stop':
				try{
					clearTimeout(reconnectTimer);
					emptyLine(function(){
						log(getTime() + "[INFO] Stopped reconnecting.");
						rl.prompt();
					});
				}catch(err){
					error(getTime() + "[ERROR] " + err);
				}
				break;
			case 'eval':
				try{
					eval(input.slice(5));
				}catch(err){
					error(getTime() + "[ERROR] " + err);
				}
				break;
			case 'send':
				try{
					if(argv[1] == undefined | argv[1] == ''){
						error(getTime() + "[ERROR] Message cannot be null. ");
					}else{
						var client_message = JSON.stringify({method: "message", message: input.slice(5)});
						connection.send(client_message);
					}
				}catch(err){
					if(err == "TypeError: Cannot read property 'send' of undefined"){
						error(getTime() + "[ERROR] Not connected to any server. ");
					}else{
						error(getTime() + "[ERROR] Client error: " + err.toString());
					}
				}
				break;
			default:
				error(getTime() + "[ERROR] Invalid command.");
		}
		main();
	});
}
var user = []
rl.question(chalk.bold.cyan(getTime() + '[INFO] Username > '), function(id){
	rl.question(chalk.bold.cyan(getTime() + '[INFO] Password > '), function(key){
		rl.setPrompt('> ');
		log(getTime() + '[INFO] Connecting to the server...')
		login(host, port, id, key);
		user = [id, key];
		main();
	});
});