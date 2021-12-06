const utils = require('./utils');
eval(utils.console.setup);

const dbApi = require('./db');
const cmdApi = {
	'list': function(){
		var uid = [];
		for(var user in userList){
			uid.push(user);
		}
		emptyLine(() => {log(lang.cmd.list.countUser.render(userTokens.length))});
		info(userTokens.join(config.cmd.userSplit));
	},
	'kick': function(argv){
		if("close" in userList[argv[1]]){
			try{
				userList[argv[1]].close();
			}catch(err){
				emptyLine(() => {warn(lang.cmd.kick.kickFailed.render(argv[1], err.stack))});
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
			emptyLine(() => {warn(lang.cmd.kick.connectionNotExist.render(argv[1]))});
		}
	},
	'eval': function(){
		try{
			eval(input.slice(5));
		}catch(err){
			error(err.stack);
		}
	},
	'stop': function(){
		dbApi.saveData(JSON.stringify({
			user: userList, 
			page: pageList,
			chat: chatList
		}), async function(err){
			if(err){
				emptyLine(() => {warn(lang.cmd.stop.saveFailed.render(err.stack))});
			}else{
				await emptyLine(() => {log(lang.cmd.stop.saved)});
				process.exit();
			}
		});
	}
}
module.exports = cmdApi;