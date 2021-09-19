const db = new Object();
db.otherData = new sqlite3.Database('other_data.db');
db.userData = new sqlite3.Database('user_data.db');
db.groupData = new sqlite3.Database('group_data.db');
db.tokenData = new sqlite3.Database('token_data.db');
if(!fs.existsSync('other_data.db')){
	var sql = 'create table data(data char(16) not null,value char(32));';
	db.otherData.get(sql,function(err,res){
		if(!err)
			console.log(JSON.stringify(res));
		else
			console.log(err);
	});
	var sql = 'insert into data values(groups,0x0);';
	db.groupData.get(sql,function(err,res){
		if(!err){
			console.log(JSON.stringify(res));
		}else{
			console.log(err);
		}
	});
}
if(!fs.existsSync('token_data.db')){
	var sql = 'create table token(token char(35) not null,uid int(16) not null,time int(16) not null);';
	db.tokenData.get(sql,function(err,res){
		if(!err)
			console.log(JSON.stringify(res));
		else
			console.log(err);
	});
}
db.newToken = function(userId){
	var sql = 'insert into token values(' + uuid + ',' + user_id + ',"' + new Date().getTime() + '");';
	db.groupData.get(sql,function(err,res){
		if(!err){
			console.log(JSON.parse(res));
			return JSON.parse(res);
		}else{
			console.log(err);
		}
	});
}
db.newGroup = function(token){
	var sql = 'select * from data where data="group"';
	db.otherData.get(sql,function(err,res){
		if(!err){
			sql = 'create table gid_' + res + '(uid int(16) not null,time int(16) not null,message char not null);';
			db.group_data.get(sql,function(err,res){
				if(!err){
					console.log(JSON.stringify(res));
					return JSON.stringify({code: 201, res: JSON.stringify(res)});
				}else{
					console.log(err);
					return JSON.stringify({code: 500, res: JSON.stringify(err)});
				}
			});
		}else{
			console.log(err);
			return JSON.stringify({code: 500, res: JSON.stringify(err)});
		}
	});
	
}
db.newMessage = function(groupId,userId,message){
	var sql = 'insert into gid' + group_id + ' ' + 'values(' + user_id + ',' + new Date().getTime() + ',\'' + message + '\');';
	db.groupData.get(sql,function(err,res){
		if(!err){
			console.log(JSON.stringify(res));
			return JSON.stringify(res);
		}else{
			console.log(err);
		}
	});
}
db.latestMessages = function(groupId,startMessage,end_message){
	var sql = 'select * from gid' + group_id + ' order by time desc limit ' + start_message + ',' + write_message + ';';
	db.groupData.get(sql,function(err,res){
		if(!err){
			console.log(JSON.stringify(res));
			return JSON.stringify(res);
		}else{
			console.log(err);
		}
	});
}
