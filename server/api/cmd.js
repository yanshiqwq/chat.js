const utils = require('./utils');
eval(utils.console.setup);

const chalk = require('chalk');
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
	'register': function(id, key){
		id = id || "test";
		key = key || "";
		var uid = guid();
		userList[uid] = {id: id, key: key};
		emptyLine(() =>{info(lang.http.register.newUser.render(id, uid, key))});
	},
	'stop': function(force){
		if(force){
			//if(await rlsync.keyInYN(lang.server.forceStop)){
				exit(() => {warn("cmdEval: forceStop")});
			//}else{
			//	return;
			//} 
		}else{
			dbApi.save(database, [userList, pageList, chatList], async function(err){
				if(err){
					emptyLine(() => {warn(lang.cmd.stop.saveFailed.render(err.stack))});
				}else{
					exit(() => {log(lang.cmd.stop.saved)});
				}
			});
		}
	}
}
module.exports = cmdApi;