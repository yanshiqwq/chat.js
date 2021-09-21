
// Config

var server = 'ws://localhost:3272/';

// Define

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
		if(err == 'Error: Server responded with a non-101 status: 401 Unauthorized\n' + 'Response Headers Follow:\n' + 'connection: close\n' + 'content-type: text/html\n' + 'content-length: 12\n'){
			error(gettime() + '[ERROR] User unauthorized.');
			console.dir(err);
			process.exit();
		}else{
			error(gettime() + '[ERROR] Connection error: ' + err.toString());
		}
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
		client.connect(server);
	});
	conn.on('close', function() {
		emptyLine(function(){
			log(gettime() + '[INFO] Connection closed.');
			rl.prompt();
		});
	});
	conn.on('message', function(message) {
		emptyLine(function(){
			messageJson = JSON.parse(message.utf8Data);
			if(messageJson['code'] == 200){
				switch(messageJson['type']){
					case 'login':
						info(gettime() + 'Successfuly login, token: ' + messageJson['token']);
						var client_message = JSON.stringify({method: "login", profile: userProfile});
						conn.send(client_message);
						break;
					case 'message':
						log(gettime() + '<' + messageJson['id'] + '> ' + messageJson['message'][1]);
						break;
					case 'userJoin':
						log(gettime() + messageJson['id'] + ' joined the chat room.');
						break;
					case 'userLeft':
						log(gettime() + messageJson['id'] + ' left the chat room.');
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
		var argv = input.split(' ')
		switch(argv[0]){
			case 'eval':
				try{
					eval(input.slice(5));
				}catch(err){
					error(gettime() + "[ERROR] " + err);
				}
				break;
			case 'send':
				try{
					if(argv[1] == undefined | argv[1] == ''){
						error(gettime() + "[ERROR] Message cannot be null. ");
					}else{
						var client_message = JSON.stringify({method: "message", message: input.slice(5)});
						connection.send(client_message);
					}
				}catch(err){
					if(err == "TypeError: Cannot read property 'send' of undefined"){
						error(gettime() + "[ERROR] Not connected to any server. ");
					}else{
						error(gettime() + "[ERROR] Client error: " + err.toString());
					}
				}
				break;
			default:
				error(gettime() + "[ERROR] Invalid command.");
		}
		main();
	});
}
var userProfile = []
rl.question('Username: ', function(user){
	rl.question('Password: ', function(pass){
		log(gettime() + '[INFO] Connecting to the server...')
		client.connect(server + '?id=' + user + '&key=' + pass);
		userProfile = [user, pass];
		main();
	});
});