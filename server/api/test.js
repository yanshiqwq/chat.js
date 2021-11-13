const utils = require('./utils');
eval(utils.console.setup);
async function handle(){
	var data = await savePage("https://www.bilibili.com/")
	console.dir(data);
	process.exit();
}
handle();