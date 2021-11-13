const utils = require('./utils');
eval(utils.console.setup);

const dbApi = require('./db');
const cmdApi = {
	'list': function(){
		var userTokens = [];
		for(var user in userList){
			userTokens.push(user.token);
		}
		emptyLine(() => {log(lang.cmd.list.countUser.render(userTokens.length))});
		info(userTokens.join(config.cmd.userSplit));
	},
	'kick': function(argv){
		if("close" in userList[argv[1]]){
			try{
				userList[argv[1]].close();
			}catch(err){
				emptyLine(() => {error(lang.cmd.kick.kickFailed.render(argv[1], err))});
			}
		}else{
			var kicked = false;
			for(var user in userList){
				if(user.id == argv[1]){
					user.close();
					kicked = true;
				}
			}
		}
		if(kicked == false){
			emptyLine(() => {error(lang.cmd.kick.connectionNotExist.render(argv[1]))});
		}
	},
	'eval': function(){
		try{
			eval(input.slice(5));
		}catch(err){
			error(err);
		}
	},
	'stop': function(){
		dbApi.saveData(userList, pageList, function(err){
			if(err){
				emptyLine(() => {error(lang.cmd.stop.saveFailed.render(err))});
			}else{
				emptyLine(() => {info(lang.cmd.stop.saved)});
				process.exit();
			}
		});
	}
}
module.exports = cmdApi;