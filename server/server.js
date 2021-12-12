/**
 * @module chat.js_server 一个简单的nodejs聊天程序
 * @file server.js 主程序
 * @author 延时qwq <yanshiqwq@126.com>
 * @link https://github.com/Yanshiqwq/chat.js/
 * @license GPL-3.0
 * @version v1.4.1
 */

global.logLevel = "debug";
const utils = require('./api/utils');
eval(utils.console.setup);
utils.console.global();

// const process = require('process');
// process.on('uncaughtException', async function(err){
// 	exit(() => {error(`Fetched an uncaught exception: ${err.stack}.`)});
// });

const express = require('express');
const yaml = require('yaml');
const path = require('path');
const fs = require('fs');

const httpApi = require('./api/http');
const pageApi = require('./api/page');
const cmdApi = require('./api/cmd');
const chatApi = require('./api/chat');
const dbApi = require('./api/db');

/**
 * @function loadConfig 加载配置文件
 * @since v1.4
 * @returns {Promise.Object} ymlConfig 配置文件
 * @returns {Promise.Object} ymlLang 语言文件
 * @throws {Promise.Error} "Failed to load config" 因为一些未捕获的原因无法加载配置文件
 */
function loadConfig(){
	return new Promise(async function(resolve, reject){
		/**
		 * @function parseConfig 解析配置文件
		 * @returns {Promise.Object} @see ymlConfig
		 * @throws {Promise.Error} @YAMLSyntaxError yml解析错误
		 * @throws {Promise.Error} "Failed to parse config file" 无法加载配置文件
		 */
		var parseConfig = function(){
			return new Promise(async function(resolve, reject){
				try{
					// 尝试读取并解析
					var ymlConfig = await yaml.parse(fs.readFileSync(`${__dirname}/config.yml`, 'utf-8'))
					resolve(ymlConfig);
				}catch(err){
					// 报错
					reject(new Error(`Failed to parse config file: ${err.stack}`));
				}
			});
		}
		/**
		 * @function parseLang 解析语言文件
		 * @alias lang ymlConfig.server.lang
		 * @var ymlConfig config.yml 配置文件
		 * @alias global.config ymlConfig
		 * @param ymlLang lang.yml 语言文件
		 * @alias global.lang ymlLang
		 * @param {Promise.Object} ymlConfig parseConfig返回的配置文件
		 * @returns {Promise.Object}
		 * @throws {Promise.Error} "Invalid language" 不存在的语言
		 * @throws {Promise.Error} "Failed to parse language file" 无法加载语言文件
		 */
		var parseLang = function(ymlConfig){
			return new Promise(function (resolve, reject){
				try{
					var lang = ymlConfig.server.lang;
					var ymlLang = yaml.parse(fs.readFileSync(`${__dirname}/lang.yml`, 'utf-8'));
					if(lang in ymlLang){
						resolve(ymlLang[ymlConfig.server.lang]);
					}else{
						reject(new Error(`Invalid language: ${lang}`));
					}
				}catch(err){
					reject(new Error(`Failed to parse language file: ${err.stack}`));
				}
			});
		}
		// 同步执行
		try{
			var ymlConfig = await parseConfig();
			var ymlLang = await parseLang(ymlConfig);
			resolve([ymlConfig, ymlLang]);
		}catch(err){
			reject(err);
		};
	});
}

/**
 * @function loadDatabase 加载数据库
 * @since v1.4
 * @returns {Promise.null} 无返回值的Promise 加载成功
 * @throws {Promise.Error} "Failed to load database" 因为一些未捕获的原因无法加载数据库
 */
function loadDatabase(config){
	return new Promise(function(resolve, reject){
		// 判断数据库存在且可读写
		try{
			fs.accessSync(path.join(__dirname, config.db.dataFile), fs.constants.F_OK | fs.constants.W_OK);
		}catch(err){
			// 判断数据库是否不存在
			if(err.code === 'ENOENT'){
				var dbPath = path.join(__dirname, config.db.dataFile);
				var sqlList = [
					"CREATE TABLE chat (id INT NOT NULL, msg STRING NOT NULL, type CHAR NOT NULL, time INT NOT NULL)",
					"CREATE TABLE page (id CHAR NOT NULL, data TEXT);",
					"CREATE TABLE user (uid CHAR (36, 36), id CHAR (1, 255), 'key' CHAR (6, 255));"
				];
				dbApi.new(dbPath, sqlList).then(function(db){
					database = db;
				}, function(err){
					emptyLine(function(){
						exit(() => {err ? error(new Error(lang.server.createDatabaseFailed.render(err.stack))) : log(lang.server.createdDatabase)});
					});
				});
			}else{
				// 数据库存在但只读
				exit(() => {error(lang.server.dataFileReadOnly)});
			}
		}
		try{
			// 尝试加载数据库
			var loadDB = function(){
				return new Promise(function(resolve, reject){
					dbApi.load(path.join(__dirname, config.db.dataFile)).then(function(data){
						resolve(data || null);
					}, function(err){
						reject(err);
					});
				});
			}
			// 加载聊天数据表
			var loadChat = function(database){
				return new Promise(function(resolve, reject){
					dbApi.list(database, "chat").then(function(data){
						resolve(data || {});
					}, function(err){
						reject(err);
					});
				});
			}
			// 加载用户数据表
			var loadUser = function(database){
				return new Promise(function(resolve, reject){
					dbApi.list(database, "user").then(function(data){
						resolve(data || {});
					}, function(err){
						reject(err);
					});
				});
			}
			// 加载页面数据表
			var loadPage = function(database){
				return new Promise(function(resolve, reject){
					dbApi.list(database, "page").then(function(data){
						resolve(data || {});
					}, function(err){
						reject(err);
					});
				});
			}
			// 公开全部
			loadDB().then(async function(database){
				var chatList = await loadChat(database);
				var userList = await loadUser(database);
				var pageList = await loadPage(database);
				resolve([chatList, userList, pageList, database]);
			}).catch(function(err){
				reject(err);
			});
		}catch(err){
			reject(err);
		}
	});
}
			
new Promise(async function(resolve, reject){
	[global.config, global.lang] = await loadConfig();
	try{	
		[global.chatList, global.userList, global.pageList, global.database] = await loadDatabase(config);
		//创建验证码数组
		global.captchaList = {};
	}catch(err){
		reject(err);
	}
	resolve();
}).then(function(){
	var app = express();
	httpApi(app);
	pageApi(app);
	chatApi(app);
	rl.setPrompt(config.server.prompt);
	app.listen(config.server.port, config.server.host, async function(){
		info(lang.server.serverRunningAt.render(config.server.host, config.server.port));
		while(1){
			var input = await rlsync.question();
			var argv = input.split(config.server.argvSplit);
			if(argv[0] != ""){
				debug(`cmdEval: ${argv.join(" ")}`);
				if(argv[0] == "eval"){
					try{
						eval(argv.slice(1).join(' '));
					}catch(err){
						emptyLine(() => {error(err.stack)});
					}
				}else{
					if(!(argv[0] in cmdApi)){
						emptyLine(() => {
							warn(lang.server.invalidCmd.render(argv[0]));
							rl.prompt();
						});
					}else{
						var cmd = `cmdApi.${argv[0]}(${'\`' + argv.slice(1).join('\`,\`') + '\`'})`;
						emptyLine(() => {debug(`cmdEval: ${cmd}`)});
						try{
							eval(cmd);
						}catch(err){
							emptyLine(() => {error(err.stack)});
						}
					}
				}
			}
		}
	});
}, function(err){
	console.dir(global);
	exit(() => error(lang.server.loadDataFailed.render(err.stack)));
}).catch(function(err){
	exit(() => fatal(err.stack));
});