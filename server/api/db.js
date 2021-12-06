const utils = require('./utils');
eval(utils.console.setup);

const sqlite = require('better-sqlite3');
const fs = require('fs');
const dbApi = {
	/**
	 * @function load 加载数据库
	 * @param {string} dbPath 数据库路径
	 * @returns {Promise.sqlite} 数据库对象
	 * @throws {error} @Error Database non-existent
	 */
	"load" : function(dbPath){
		return new Promise(function(resolve, reject){
			if(!fs.existsSync(dbPath)){
				reject(new Error("Database non-existent"));
			}else{
				resolve(new sqlite(dbPath));
			}
		});
	},
	/**
	 * @function new 创建数据库
	 * @param {string} dbPath 数据库路径
	 * @param {string[]} sqllist 需要执行的数据库列表
	 * @returns {Promise.sqlite} 数据库对象
	 * @throws {error} @Error Database exists
	 */
	"new": function(dbPath, sqlList){
		return new Promise(function(resolve, reject){
			if(fs.existsSync(dbPath)){
				reject(new Error("Database exists"));
			}else{
				const db = new sqlite(dbPath);
				for(var sql in sqlList){
					db.prepare(sqlList[sql]).run();
				}
				resolve(db);
			}
		});
	},
	"save": function(db, data, table){
		return new Promise(function(resolve, reject){
			db.prepare(`INSERT INTO ${table} values(${data.join(",")};`).run(function(err){
				err ? reject(err) : resolve();
			});
		});
	},
	"list": function(db, table){
		return new Promise(function(resolve, reject){
			try{
				resolve(db.prepare(`SELECT * FROM ${table} ;`).all());
			}catch(err){
				reject(err);
			}
		});
	},
	"query": function(db, table, key, value){
		return db.prepare(`SELECT * FROM ${table} WHERE ${key} = ${value} ;`).get();
	}
}
for(var value in dbApi){
	exports[value] = dbApi[value];
}