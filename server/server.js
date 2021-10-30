
const utils = require('./api/utils');
eval(utils.console.setup);

const express = require('express');
const expressws = require('express-ws');

const httpApi = require('./api/http');
const pageApi = require('./api/page');
const wsApi = require('./api/ws');
const dbApi = require('./api/db');

// Config

var port = 3272;
var host = "0.0.0.0";

// Server

captchaList = {};
userList = {};
pageList = {};

var app = express();
expressws(app);

httpApi(app);
pageApi(app);

wsApi(app);

function main(){
	rl.question('> ', (input) => {
		var argv = input.split(' ');
		switch(argv[0]){
			case 'list':
				var userTokens = [];
				for(var user in userList){
					userTokens.push(user.token);
				}
				emptyLine(() => {log(`There are ${userTokens.length} users in the list:`)});
				info(userTokens.join(', '));
				break;
			case 'kick':
				try{
					userList[argv[1]].close();
				}catch (err){
					if(err == 'TypeError: Cannot read property \'close\' of undefined'){
						var kicked = false;
						for (var user in userList) {
							if (user.id == argv[1]) {
								user.close();
								kicked = true;
							}
						}
					}else{
						emptyLine(() => {error(`Failed to close the connection "${argv[1]}" : ${err}`)});
					}
				}
				if(kicked == false){
					emptyLine(() => {error(`User or connection not exists: ${argv[1]}`)});
				}
				break;
			case 'eval':
				try{
					eval(input.slice(5));
				}catch (err){
					error(err);
				}
				break;
			case '':
				break;
			case 'stop':
				dbApi.saveData(userList, pageList, (err) => {
					if(err){
						emptyLine(() => {error(`Failed to save data: ${err}`)});
					}else{
						emptyLine(() => {info(`Successfully saved data.`)});
						process.exit();
					}
				});
			default:
				warn(`Invalid command: ${argv[0]}.`);
				break;
		}
		main();
	});
}
rl.setPrompt('> ')
app.listen(port, host, function(){
	info(`Server running at ${host}:${port}.`);
	main();
});