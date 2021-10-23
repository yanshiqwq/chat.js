const readline = require('readline');
const zlib = require('zlib');
const chalk = require('chalk');
var os = require('os');
if(os.platform() == 'win32'){  
	if(os.arch() == 'ia32'){
		var chilkat = require('@chilkat/ck-node16-win-ia32');
	}else{
		var chilkat = require('@chilkat/ck-node16-win64'); 
	}
}else if(os.platform() == 'linux'){
	if(os.arch() == 'arm'){
		var chilkat = require('@chilkat/ck-node16-arm');
	}else if(os.arch() == 'x86'){
		var chilkat = require('@chilkat/ck-node16-linux32');
	}else{
		var chilkat = require('@chilkat/ck-node16-linux64');
	}
}else if(os.platform() == 'darwin'){
	var chilkat = require('@chilkat/ck-node16-macosx');
}
function getTime(){
	if(new Date().getHours() < 10) {
		var hours = `0${new Date().getHours()}`;
	}else{
		var hours = new Date().getHours();
	}
	if(new Date().getMinutes() < 10) {
		var minutes = `0${new Date().getMinutes()}`;
	}else{
		var minutes = new Date().getMinutes();
	}
	if(new Date().getSeconds() < 10) {
		var seconds = `0${new Date().getSeconds()}`;
	}else{
		var seconds = new Date().getSeconds();
	}
	return `[${hours}:${minutes}:${seconds}] `;
}
const utils = {
	"console": {
		"error": function(log, hideTime, cws){
			if(hideTime == undefined){
				log = `[${cws}] [E] ${log}`;
				console.error(chalk.bold.red(getTime() + log));
			}else{
				console.error(chalk.bold.red(log));
			}
		},
		"warn": function(log, hideTime, cws){
			if(hideTime == undefined){
				log = `[${cws}] [W] ${log}`;
				console.warn(chalk.bold.yellow(getTime() + log))
			}else{
				console.warn(chalk.bold.yellow(log))
			}
			
		},
		"log": function(log, hideTime, cws){
			if(hideTime == undefined){
				log = `[${cws}] [I] ${log}`;
				console.log(chalk.bold.cyan(getTime() + log))
			}else{
				console.log(chalk.bold.cyan(getTime() + log))
			}
		},
		"info": function(log, hideTime, cws){
			if(hideTime == undefined){
				log = `[${cws}] [L] ${log}`;
				console.info(chalk.bold.greenBright(getTime() + log))
			}else{
				console.info(chalk.bold.greenBright(getTime() + log))
			}
		}
	},
	"rl": readline.createInterface({
		input: process.stdin,
		output: process.stdout
	}),
	"getCookie": function(req){
		var cookies = {};
		req.headers.cookie && req.headers.cookie.split(';').forEach(function(cookie){
			var parts = cookie.split('=');
			cookies[parts[0].trim()] = (parts[1] || '').trim();
		});
		return cookies;
	},
	"emptyLine": async function(callback){
		await readline.clearLine(process.stdout, 0, function(){
			readline.cursorTo(process.stdout, 0, function(){
				callback();
			});
		});
		utils.rl.prompt();
	},
	"timeStamp": function(){
		return new Date().getTime();
	},
	"guid": function(){
		var s = [];
		var hexDigits = '0123456789abcdef';
		for(var i = 0; i < 36; i++){
			s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		s[14] = '4';
		s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
		s[8] = s[13] = s[18] = s[23] = '-';
		var guid = s.join('');
		return guid;
	},
	"getTime": () => getTime(),
	"saveUrl": (url) => {
		var mht = new chilkat.Mht();
		data = mht.GetMHT(url);
		if(mht.LastMethodSuccess == true){
			zlib.gzipSync(data)
			return false, btoa(data);
		}else{
			return true, mht.LastErrorText;
		}
	}
}
for(var value in utils){
	exports[value] = utils[value];
}
exports.global = () => {
	for(var value in utils){
		if(value != "console"){
			global[value] = utils[value];
		}
	}
}
exports.setup = `
	utils.global();
	var types = ["error", "warn", "log", "info"];
	for(var type in types){
		eval(\`
			function \${types[type]}(log, hideTime){
				utils.console.\${types[type]}(log, hideTime, '\${require("path").basename(__filename)}')
			}
		\`)
	}
`;