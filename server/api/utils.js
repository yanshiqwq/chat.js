/**
 * @file utils.js 一些实用函数
 * @author 延时qwq <yanshiqwq@126.com>
 * @version v1.4.1
 */

const readline = require('readline');
const request = require('request');
const chalk = require('chalk');
const util = require('util');
const utils = {
	rlsync: {
		moveCursor: function(pos){
			readline.clearLine(process.stdout, pos);
			readline.moveCursor(process.stdout, pos, 0);
		},
		question: function(){
			return new Promise(function(resolve){
				rl.question(config.server.prompt, function(input){
					resolve(input);
				});
			});
		}
	},
	console: {
		/**
		 * @function global 将所有的utils函数公开为全局函数
		 * @since v1.3.1
		 * @descript 只有程序启动时才会用得到
		 * @example utils.console.global();
		 */
		global: function(){
			for(var value in utils){
				if(value != "console"){
					global[value] = utils[value];
				}
			}
			var logGroup = ["debug", "log", "info", "warn", "error", "fatal"];
			global.logLevel = logGroup.indexOf(global.logLevel);
		},
		/**
		 * @function fatal 严重错误
		 * @since v1.1
		 * @param {any} log - 要显示的内容
		 * @param {bool} hideTime - 是否隐藏时间
		 * @param {string} cws - 获取运行此函数脚本的名称(Current Working Script)
		 * @example fatal("qwq", false, "server.js");
		 */
		fatal: function(log, hideTime, cws){
			if(global.logLevel <= 5 || !global.logLevel){
				console.error(chalk.bold.red(hideTime ? "" : `${utils.getTime()}[${cws}] [F] ${log}`));
			}
		},
		/**
		 * @function error 错误
		 * @see fatal
		 */
		error: function(log, hideTime, cws){
			if(global.logLevel <= 4 || !global.logLevel){
				console.error(chalk.bold.red(hideTime ? "" : `${utils.getTime()}[${cws}] [E] ${log}`));
			}
		},
		/**
		 * @function warn 警告
		 * @see fatal
		 */
		warn: function(log, hideTime, cws){
			if(global.logLevel <= 3 || !global.logLevel){
				console.warn(chalk.bold.yellow(hideTime ? "" : `${utils.getTime()}[${cws}] [W] ${log}`));
			}
		},
		/**
		 * @function log 日志
		 * @see fatal
		 */
		log: function(log, hideTime, cws){
			if(global.logLevel <= 2 || !global.logLevel){
				console.log(chalk.bold.cyan(hideTime ? "" : `${utils.getTime()}[${cws}] [L] ${log}`));
			}
		},
		/**
		 * @function info 信息
		 * @see fatal
		 */
		info: function(log, hideTime, cws){
			if(global.logLevel <= 1 || !global.logLevel){
				console.info(chalk.bold.greenBright(hideTime ? "" : `${utils.getTime()}[${cws}] [I] ${log}`));
			}
		},
		/**
		 * @function debug 调试
		 * @see fatal
		 */
		debug: function(log, hideTime, cws){
			if(global.logLevel <= 0){
				console.debug(chalk.bold.grey(hideTime ? "" : `${utils.getTime()}[${cws}] [D] ${log}`));
			}
		},
		/**
		 * @function setup 初始化
		 * @descript 每个脚本都需eval执行此字符串函数以初始化utils
		 * @example eval(utils.console.setup);
		 * 
		 * @function String.prototype.render 渲染
		 * @descript 将变量载入字符串
		 * @example info(lang.server.serverRunningAt.render(config.server.host, config.server.port));
		 */
		setup: `
			var types = ["debug", "log", "info", "warn", "error", "fatal"];
			String.prototype.render = function(...args){
				return require("util").format(this.toString(), ...args);
			}
			for(var type in types){
				eval(\`
					function \${types[type]}(log, hideTime){
						utils.console.\${types[type]}(log, hideTime, '\${require("path").basename(__filename)}:' + new Error().stack.split(":")[7]);
					}
				\`)
			}
		`
	},
	/**
	 * @instance rl readline模块初始化
	 * @since v1.1
	 * @descript 可以通过rl调用readline
	 * @example rl.prompt();
	 */
	rl: readline.createInterface({
		input: process.stdin,
		output: process.stdout
	}),
	/**
	 * @function getCookie 获取cookie
	 * @since v1.3
	 * @deprecated v1.3
	 * @param {object} req - express的req对象
	 * @returns {list} cookie列表
	 */
	// getCookie: function(req){
	// 	var cookies = {};
	// 	req.headers.cookie && req.headers.cookie.split(';').forEach(function(cookie){
	// 		var parts = cookie.split('=');
	// 		cookies[parts[0].trim()] = (parts[1] || '').trim();
	// 	});
	// 	return cookies;
	// },
	/**
	 * @function emptyLine 清空当前行
	 * @since v1.1
	 * @descript 一般会搭配输出命令使用
	 * @param {callback} callback - 回调函数
	 * @param {bool} hidePrompt - 是否隐藏命令提示符
	 * 
	 * @callback callback
	 * @function callback 清空行执行的回调函数
	 */
	emptyLine: async function(callback, hidePrompt){
		readline.clearLine(process.stdout, 0, function(){
			readline.cursorTo(process.stdout, 0, function(){
				util.promisify(callback)().then(function(){
					
				});
			});
		});
		if(!hidePrompt){
			this.rl.prompt();
		}
	},
	/**
	 * @function timeStamp 获取时间戳
	 * @since v1.1
	 * @example console.log(timeStamp());
	 * @returns {string} 时间戳
	 */
	timeStamp: function(){
		return new Date().getTime();
	},
	/**
	 * @function guid
	 * @since v1.0
	 * @example console.log(guid());
	 * @returns {string} 生成的GUID
	 */
	guid: function(){
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
	/**
	 * @function getTime 获取时间
	 * @since v1.0
	 * @example console.log(guid());
	 * @returns {string} 时间
	 */
	getTime: function(){
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
	/**
	 * @function randStr 生成随机字符串
	 * @since v1.4
	 * @param {number} length - 字符串长度
	 * @param {string} chars - 字符列表
	 * @returns {string} 生成的随机字符串
	 */
	randStr: function(length, chars){
		var result = '';
		for(var i = length; i > 0; --i){
			result += chars[Math.floor(Math.random() * chars.length)];
		}
		return result;
	},
	/**
	 * @function getPromise 将request模块的get promise化
	 * @since v1.4
	 * @see request.get
	 * @returns {Promise} get请求返回值
	 */
	getPromise: util.promisify(request.get),
	/**
	 * @function testUrl 检测字符串是否为Url链接
	 * @since v1.3.1
	 * @param {string} url 
	 * @returns {bool} 是否为Url
	 */
	testUrl: function(url){
		return new RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/).test(url);
	},
	/**
	 * @function exit 执行函数并退出
	 * @since v1.4.1
	 * @param {callback} func 清空行后需要执行的函数
	 * @param {Number} code 程序返回值
	 */
	exit: async function(func, code){
		await this.emptyLine(func, true);
		setTimeout(() => {process.exit(code || 1)});
	}
}
// 公开所有函数
for(var value in utils){
	exports[value] = utils[value];
}