
const utils = require('./api/utils');
eval(utils.setup);

const express = require('express');
const expressws = require('express-ws');
const bodyParser = require('body-parser');

const httpApi = require('./api/http');
const wsApi = require('./api/ws');

// Config

var port = 3272;

// Server

captchaList = {};
userList = {};
urlList = {};

var app = express();
app.use(bodyParser.json());
expressws(app)
httpApi(app);
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
				log(`There are ${userTokens.length} users in the list:`);
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
						emptyLine(() => { error(`Failed to close the connection "${argv[1]}" : ${err}`); });
					}
				}
				if(kicked == false){
					emptyLine(() => { error(`User or connection not exists: ${argv[1]}`); });
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
				process.exit();
			default:
				error(`Invalid command: ${argv[0]}.`);
				break;
		}
		main();
	});
}
new Promise(() => {rl.setPrompt('> ')})
.then(app.listen(port))
.then(log(`Server running at 0.0.0.0:${port}.`))	
.then(rl.prompt())
.then(main())
.catch((err) => {
	error(err);
});