const utils = require('./utils');
eval(utils.console.setup);

const chatApi = function(app){
	app.post("/message/get", (req, res) => {
		try{
			var reqJson = req.body;
			if(userList[reqJson.id] == reqJson.key){
				var msgList = {}
				for(var key in chatList){
					if(end in reqJson){
						if(parseInt(key) >= reqJson.begin && parseInt(key) < reqJson.end){
							msgList[(parseInt(key) - reqJson.lastReadId).toString()] = chatList[key];
						}
					}else{
						if(parseInt(key) >= reqJson.begin){
							msgList[(parseInt(key) - reqJson.lastReadId).toString()] = chatList[key];
						}
					}
				}
				res.status(200);
				res.json({code: 200, time: timeStamp(), msg: msgList});
			}else{
				res.status(400);
				res.json({code: 400, time: timeStamp(), message: lang.chat.get.validationFailed});
			}
		}catch(err){
			res.status(400);
			res.json({code: 400, time: timeStamp(), message: lang.chat.get.badRequest, error: err.stack});
		}
	});
	app.post("/message/send", (req, res) => {
		try{
			var reqJson = req.body;
			console.dir(reqJson);
			if(userList[reqJson.id] == reqJson.key){
				chatId = chatList.length;
				chatList[chatId.toString()] = reqJson.msg;
				res.status(200);
				res.json({code: 200, time: timeStamp(), id: chatId});
			}else{
				res.status(400);
				res.json({code: 400, time: timeStamp(), message: lang.chat.send.validationFailed});
			}
		}catch(err){
			res.status(400);
			res.json({code: 400, time: timeStamp(), message: lang.chat.send.badRequest, error: err.stack});
		}
	});
}
module.exports = chatApi;