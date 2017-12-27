var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var client = require('cheerio-httpcli');
var util = require('util');
var reqe = require('request');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

//受け取ったメッセージを送信する
io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    console.log('message: ' + msg);
  });
});

//port解放
http.listen(process.env.PORT, function(){
  console.log('listening on *:5000');
});

//google-homeからメッセ―ジを受信する
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

app.post('/', function(request, response, next) {
	//Dialogflowからのパラメータ取得
    const message = (function (result) {
        if (result) {
            return result.parameters.any
        }
        return '';
    })(request.body.result);

	var createResultObject =  function (hasScreen, word, basicCard) {
	    return {
	      "speech": word , "displayText": word
	    };
 	};
  
  	var sendResponse = function(response, resultObject){
    	response.setHeader("Content-Type", "application/json");
    	response.send(JSON.stringify(resultObject));
  	};
  
  	if (message.length > 0) {
  		//slack通知
  		var options = {
	    	url: 'https://hooks.slack.com/services/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',
    		form: 'payload={"text": "' + message + '", "username": "home", "channel": "g_home"}',
    		json: true
		};
  		reqe.post(options, function(error, response, body){
 	 		if (!error && response.statusCode == 200) {
    			console.log(body.name);
		    	io.emit('chat message', 'okk');
  			} else {
    			console.log('error: '+ response.statusCode + body);
		    	io.emit('chat message', 'err');
  			}
		});

  		//homeへ通知
    	sendResponse(response, createResultObject('', message , ''));
  		
  		//webへ通知
    	io.emit('chat message', message);
  	} else {
    	// sendResponse(response, createResultObject('', "エラー", ''));
    	// io.emit('chat message', 'エラー');
    	//データがセットされていない場合は、なにもしない
  	}
});
