const utils = require('./api/utils');
eval(utils.console.setup);

const expressws = require('express-ws');
const express = require('express');
const yaml = require('yaml');
const fs = require('fs');

const httpApi = require('./api/http');
const pageApi = require('./api/page');
const cmdApi = require('./api/cmd');
const wsApi = require('./api/ws');

global.config = {};
global.lang = {};
try{
	var ymlConfig = yaml.parse(fs.readFileSync(`${__dirname}/config.yml`, 'utf-8'));
	var ymlLang = yaml.parse(fs.readFileSync(`${__dirname}/lang.yml`, 'utf-8'));
	if(!lang in ymlLang){
		throw Error("Invalid language");
	}
	global.config = ymlConfig;
	global.lang = ymlLang[ymlConfig.server.lang];
}catch(err){
	error("Failed to load config: " + err);
	process.exit(1);
}

captchaList = {};
userList = {};
pageList = {};

var app = express();
expressws(app);
httpApi(app);
pageApi(app);
wsApi(app);

function main(){
	rl.question(config.server.prompt, function(input){
		var argv = input.split(config.server.argvSplit);
		if(argv[0] != ""){
			if(!(argv[0] in cmdApi)){
				emptyLine(() => {warn(lang.server.invalidCmd.render(argv[0]))});
			}else{
				console.dir(argv);
				eval(`cmdApi.${argv[0]}(argv.slice(1))`);
			}
		}
		main();
	});
}
rl.setPrompt(config.server.prompt)
app.listen(config.server.port, config.server.host, function(){
	info(lang.server.serverRunningAt.render(config.server.host, config.server.port));
	main();
});