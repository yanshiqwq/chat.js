var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var file = 'group_data.db';
var db = new Object();
sqlite = new sqlite3.Database(file);
exists = fs.existsSync(file);
new_group = function(group_id){
	var sql = "create table gid" + group_id.toString() + "(uid int(16) not null,time int(16) not null,message char not null);";
	sqlite.get(sql,function(err,res){
		if(!err)
			console.log(JSON.stringify(res));
		else
			console.log(err);
	});
}
new_message = function(group_id,user_id,message){
	var sql = "insert into gid" + group_id.toString() + " " + "values(" + user_id + "," + new Date().getTime() + ",\"" + message + "\");";
	sqlite.get(sql,function(err,res){
		if(!err)
			console.log(JSON.stringify(res));
		else
			console.log(err);
	});
}
latest_messages = function(group_id,max_messages){
	var sql = "select * from gid" + group_id.toString() + " order by time desc limit 0," + max_messages.toString() + ";";
	sqlite.get(sql,function(err,res){
		if(!err)
			console.log(JSON.stringify(res));
		else
			console.log(err);
	});
}