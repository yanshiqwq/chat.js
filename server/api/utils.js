const readline = require('readline');
const cheerio = require('cheerio');
const request = require('request');
const chalk = require('chalk');
const util = require('util');
const path = require('path');
const url = require('url');
const utils = {
	"console": {
		"global": function(){
			for(var value in utils){
				if(value != "console"){
					global[value] = utils[value];
				}
			}
		},
		"error": function(log, hideTime, cws){
			if(hideTime == undefined){
				log = `[${cws}] [E] ${log}`;
				console.error(chalk.bold.red(getTime() + log));
			}else{
				console.error(chalk.bold.red(log));
			}
		},
		"warn": function(log, hideTime, cws){
			if(hideTime == undefined){
				log = `[${cws}] [W] ${log}`;
				console.warn(chalk.bold.yellow(getTime() + log))
			}else{
				console.warn(chalk.bold.yellow(log))
			}
			
		},
		"log": function(log, hideTime, cws){
			if(hideTime == undefined){
				log = `[${cws}] [L] ${log}`;
				console.log(chalk.bold.cyan(getTime() + log))
			}else{
				console.log(chalk.bold.cyan(getTime() + log))
			}
		},
		"info": function(log, hideTime, cws){
			if(hideTime == undefined){
				log = `[${cws}] [I] ${log}`;
				console.info(chalk.bold.greenBright(getTime() + log))
			}else{
				console.info(chalk.bold.greenBright(getTime() + log))
			}
		},
		"setup": `
			utils.console.global();
			String.prototype.render = function(...args){
				return require("util").format(this.toString(), ...args);
			}
			var types = ["error", "warn", "log", "info"];
			for(var type in types){
				eval(\`
					function \${types[type]}(log, hideTime){
						utils.console.\${types[type]}(log, hideTime, '\${require("path").basename(__filename)}:' + new Error().stack.split(":")[7]);
					}
				\`)
			}
		`
	},
	"rl": readline.createInterface({
		input: process.stdin,
		output: process.stdout
	}),
	"getCookie": function(req){
		var cookies = {};
		req.headers.cookie && req.headers.cookie.split(';').forEach(function(cookie){
			var parts = cookie.split('=');
			cookies[parts[0].trim()] = (parts[1] || '').trim();
		});
		return cookies;
	},
	"emptyLine": async function(callback){
		await readline.clearLine(process.stdout, 0, function(){
			readline.cursorTo(process.stdout, 0, function(){
				callback();
			});
		});
		utils.rl.prompt();
	},
	"timeStamp": function(){
		return new Date().getTime();
	},
	"guid": function(){
		var s = [];
		var hexDigits = '0123456789abcdef';
		for(var i = 0; i < 36; i++){
			s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		s[14] = '4';
		s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
		s[8] = s[13] = s[18] = s[23] = '-';
		var guid = s.join('');
		return guid;
	},
	"getTime": function(){
		if(new Date().getHours() < 10) {
			var hours = `0${new Date().getHours()}`;
		}else{
			var hours = new Date().getHours();
		}
		if(new Date().getMinutes() < 10) {
			var minutes = `0${new Date().getMinutes()}`;
		}else{
			var minutes = new Date().getMinutes();
		}
		if(new Date().getSeconds() < 10) {
			var seconds = `0${new Date().getSeconds()}`;
		}else{
			var seconds = new Date().getSeconds();
		}
		return `[${hours}:${minutes}:${seconds}] `;
	},
	"randStr": function(length, chars){
		var result = '';
		for(var i = length; i > 0; --i){
			result += chars[Math.floor(Math.random() * chars.length)];
		}
		return result;
	},
	"getPromise": util.promisify(request.get),
	"savePage": async function(pageUrl){
		const userAgents = [
			'Mozilla/5.0 (Windows NT 10; Win64; x64; rv:83.0) Gecko/20100101 Firefox/83.0'
		];
		var userAgent = userAgents[parseInt(Math.random() * userAgents.length)];
		var res = await getPromise(pageUrl, {headers: {'User-Agent': userAgent}});
		while(res.statusCode in [301, 302, 303, 307]){
			var link = res.headers['Location'];
			var res = await getPromise(link, {headers: {'User-Agent': userAgent}});
		}
		$ = cheerio.load(res.body);
		var linkRaw = [];
		var links = [];
		var jsObjects = $("script").filter("src");
		var cssObjects = $("link").filter("href");
		var backImgObjects = $("div").filter("style*=background-image");
		for(var index in jsObjects){
			if(util.isObject(jsObjects[index]) && "attrib" in jsObjects[index]){
				linkRaw.push(jsObjects[index].attrib.src);
			}
		}
		for(var index in cssObjects){
			linkRaw.push(cssObjects[index].attrib.href);
		}
		for(var index in backImgObjects){
			linkRaw.push(backImgObjects[index].attrib.style.match(/(?<=background-image:[\s]+).+?(?=;)/)[0]);
		}
		console.dir(linkRaw)
		for(var index in linkObjects){
			var link = linkObjects[index].attribs.href;
			if(link.substr(0,1) != "#"){
				if(link.substr(0,2) == "//"){
					link = url.parse(pageUrl).protocol + link;
				}
				if(this.testUrl(link)){
					links.push(link);
				}
			}
		}
		return links;
	},
	"testUrl": function(url){
		return new RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/).test(url);
	}
}
for(var value in utils){
	exports[value] = utils[value];
}