
// Config

var server = 'ws://localhost:3272/';

// Define

const {app, BrowserWindow} = require('electron')
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
	return [hours, minutes, seconds];
}

// Client

var connection;
client.on('connectFailed', function(err){
	client.connect(server);
});
client.on('connect', function(conn){
	conn.on('error', function(err) {
		client.connect(server);
	});
	conn.on('close', function() {
	});
	conn.on('message', function(message) {
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
	});
});
client.connect(server);
function createWindow(){   
  // 创建浏览器窗口
  
  // 加载index.html文件
  win.loadFile('web/index.html');
}
app.on('ready', function(){
	let win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true
		}
	});
});