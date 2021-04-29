var db = require('./db-define.js');
const http = require("http");
const url = require("url");
const server = http.createServer(function(req, res) {
	var obj = url.parse(res,true)
	if (obj.pathname == '/new_group') {
		res.writeHead(200, { "Content-type": "text/json" });
		db.new_group()
	}
});
function uuid() {
	var s = [];
	var hexDigits = "0123456789abcdef";
	for (var i = 0; i < 36; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[14] = "4";
	s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
	s[8] = s[13] = s[18] = s[23] = "-";
	var uuid = s.join("");
	return uuid;
}
function gettime(){
	if(new Date().getHours()<10){
		var hours="0"+new Date().getHours();
	}else{
		var hours=new Date().getHours();
	}
	if(new Date().getMinutes()<10){
		var minutes="0"+new Date().getMinutes();
	}else{
		var minutes=new Date().getMinutes();
	}
	if(new Date().getSeconds()<10){
		var seconds="0"+new Date().getSeconds();
	}else{
		var seconds=new Date().getSeconds();
	}
	return "["+hours+":"+minutes+":"+seconds+"] ";
}
server.listen(3272,'0.0.0.0');
console.info(gettime() + "server running at 0.0.0.0:3272");