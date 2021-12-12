const utils = require('../api/utils');
eval(utils.console.setup);

const axios = require('axios')

var req = {
    "id": "yanshiqwq",
    "key": "minecraft666",
    "captcha": [
        "d266d0b7-cf46-e9e0-087c-e3637266647d", "YFDJ"
    ]
} 
axios.post('http://127.0.0.1:3272/register', req).then(function(res){
	log(res.data);
}).catch(function(err){
	if(err.response){
		error(`HTTP/1.1 ${err.response.status}`);
		fatal(err.response.data);
	}else if(err.request){
		info(err.request);
	}else{
		fatal(err.stack);
	}
});