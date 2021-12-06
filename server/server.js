/**
 * @module chat.js_server 一个简单的nodejs聊天程序
 * @file server.js 主程序
 * @author 延时qwq <yanshiqwq@126.com>
 * @link https://github.com/Yanshiqwq/chat.js/
 * @license GPL-3.0
 * @version v1.4.1
 */

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
	return new Promise(function(resolve, reject){
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
					global.config = ymlConfig;
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
				var lang = ymlConfig.server.lang;
				var ymlLang = yaml.parse(fs.readFileSync(`${__dirname}/lang.yml`, 'utf-8'));
				if(lang in ymlLang){
					resolve(ymlLang);
				}else{
					reject(new Error(`Invalid language: ${lang}`));
				}
			}).then(function(ymlLang){
				global.lang = ymlLang[ymlConfig.server.lang];
				resolve(ymlLang);
			}, async function(err){
				reject(new Error(`Failed to parse language file: ${err.stack}`));
			});
		}
		// 同步执行
		parseConfig().then(function(ymlConfig){
			return ymlConfig, parseLang(ymlConfig); // return ymlConfig, ymlLang;
		}).catch(function(err){
			reject(err);
		});
	});
}

/**
 * @function loadDatabase 加载数据库
 * @since v1.4
 * @returns {Promise.null} 无返回值的Promise 加载成功
 * @throws {Promise.Error} "Failed to load database" 因为一些未捕获的原因无法加载数据库
 */
async function loadDatabase(config){
	return new Promise(async function(resolve, reject){
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
					emptyLine(async function(){
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
			var database = await dbApi.load(path.join(__dirname, config.db.dataFile));
			// 加载聊天数据表
			var loadChat = dbApi.list(database, "chat").then(function(data){
				resolve(lang.server.loadedData);
				chatList = JSON.parse(data);
			}, function(err){
				reject(err);
				chatList = {};
			});
			// 加载用户数据表
			var loadUser = dbApi.list(database, "user").then(function(data){
				resolve(lang.server.loadedData);
				userList = JSON.parse(data);
			}, function(err){
				reject(err);
				userList = {};
			});
			// 加载页面数据表
			var loadPage = dbApi.list(database, "page").then(function(data){
				resolve(lang.server.loadedData);
				pageList = JSON.parse(data);
			}, function(err){
				reject(err);
				pageList = {};
			});
			//创建验证码数组
			Promise.all([loadChat, loadUser, loadPage]).then(function(){
				global.database = database;
				resolve(database);
			}).catch(function(err){
				reject(new Error(lang.server.loadDataFailed.render(err.stack)));
			})
			captchaList = {};
		}catch(err){
			reject(new Error(`Failed to load database: ${err.stack}`));
		}
	});
}
function promptSync(){
	return new Promise(function(resolve){
		rl.question(config.server.prompt, function(input){
			resolve(input);
		});
	});
}
			
function handle(){
	return new Promise(async function(resolve, reject){
		try{
			await loadConfig();
			await loadDatabase(config, lang);
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
				var input = await promptSync();
				var argv = input.split(config.server.argvSplit);
				if(argv[0] != ""){
					if(!(argv[0] in cmdApi)){
						emptyLine(() => {
							warn(lang.server.invalidCmd.render(argv[0]));
							rl.prompt();
						});
					}else{
						eval(`cmdApi.${argv[0]}(argv.slice(1))`);
					}
				}
			}
		});
	}, function(err){
		exit(() => error(err.stack));
	}).catch(function(err){
		exit(() => error(lang.server.loadDataFailed.render(err.stack)));
	});
}
handle();