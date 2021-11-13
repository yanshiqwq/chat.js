const utils = require('./utils');
eval(utils.console.setup);

function verify(params, callback){
	/*var ret = false;
	if (userList[params["id"]] == params["key"]) {
		ret = true;
	}
	return ret;*/
	callback()
}
const wsApi = function(app){
	app.ws('/message', function(ws, req){
		ws.token = crypto.createHash(config.ws.wsIdGenerator).update(req.headers['sec-websocket-key']).digest('hex').slice(1,8);
		emptyLine(() => {log(lang.ws.newConnection.render(ws.token))});
		verify(req.query, () => {
			userList[ws.token] = ws;
			info(lang.ws.userJoin.render(ws.id));
			var msg = JSON.stringify({code: 200, time: timeStamp(), type: 'userJoin', id: ws.id});
			for(var user in userList){
				userList[user].send(msg);
			}
			ws.send(JSON.stringify({code: 200, time: timeStamp(), type: 'login', token: ws.token}));
			ws.on('message', function(raw){
				var message = JSON.parse(raw);
				if(message == undefined || message == ''){
					emptyLine(() => {log(lang.ws.getEmptyMessage)});
					var msg = JSON.stringify({code: 400, time: timeStamp(), type: 'error', message: lang.ws.unexpectedEnd});
					ws.send(msg);
					emptyLine(() => {warn('> ' + msg)});
				}else{
					emptyLine(() => {
						try{
							log(ws.token + ' > ' + raw);
							switch(message['method']){
								case 'message':
									var msg = JSON.stringify({code: 200, id: ws.id, time: timeStamp(), type: 'message', message: ['text', message['message']]});
									try{
										emptyLine(() => {log(`<${ws.id}> ${message['message']}`)});
										for(var user in userList){
											userList[user].send(msg);
										}
									}catch(err){
										console.dir(err)
									}
									break;
								default:
									var msg = JSON.stringify({code: 400, id: ws.id, token: ws.token, time: timeStamp(), type: 'error', message: 'Invalid method'});
									ws.send(msg);
									emptyLine(() => {warn(`${ws.token} > INVALID_METHOD: ${message['method']}`)});
							}
						}catch(err){
							var msg = JSON.stringify({code: 500, time: timeStamp(), type: 'error', message: err.message});
							ws.send(msg);
							emptyLine(() => {error('> ' + msg)});
						}
					});
				};
				ws.on('close', function(code, reason){
					delete userList[ws.token];
					emptyLine(() => {
						log(`Connection closed: ${ws.id}(${ws.token})`)
						info(`${ws.id} left the chat room.`);
					});
					var msg = JSON.stringify({code: 200, time: timeStamp(), type: 'userQuit', id: ws.id});
					for(var user in userList){
						userList[user].send(msg);
					}
				});
				ws.on('error', function(code, reason){
					emptyLine(() => {warn(`Client error (${code}), reason: ${reason}`)});
				});
			});
		}, () => {
			ws.send(JSON.stringify({code: 401, id: ws.id, token: ws.token, time: timeStamp(), type: 'error', message: 'Unauthorized'}));
			emptyLine(() => {warn(`${ws.token} > UNAUTHORIZED: ${message['method']}`)});
		});
	});
}
module.exports = wsApi;