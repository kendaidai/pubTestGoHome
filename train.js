var express = require('express');
var bodyParser = require('body-parser');
var client = require('cheerio-httpcli');
var util = require('util');

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

app.post('/', function(request, response, next) {
  const HANKYU_URL = 'http://www.hankyu.co.jp/railinfo/';
  
  if (!request.body) {
    response.status(400).send(http.STATUS_CODES[400] + '\r\n');
    return ;
  }
  console.log('[REQUEST]', util.inspect(request.body,false,null));

  //Dialogflowからのパラメータ取得
  const train = (function (result) {
      if (result) {
        return result.parameters.any
      }
      return '';
  })(request.body.result);

  const text = train;

  const hasScreen = (function (data) {
      if (data.surface && data.surface.capabilities) {
        for (let v of data.surface.capabilities) {
          if (v.name === 'actions.capability.SCREEN_OUTPUT'){
            console.log('ENABLE SCREEN_OUTPUT');
            return true;
          };
        };
      }
      return false;
  })(request.body.originalRequest.data);

  var createResultObject =  function (hasScreen, word, basicCard) {
    if (hasScreen) {
      return  {
        "speech": word,
        "data": {
          "google": {
            "expectUserResponse": false,
            "richResponse": {
              "items": [
                {
                    "simpleResponse": {
                      "textToSpeech": word
                    }
                  },
                  basicCard
                ],
                "suggestions": []
              }
            },
            "possibleIntents": [
              {
                "intent": "actions.intent.TEXT"
              }
            ]
        }
      };
    }
    return {
      "speech": word , "displayText": word
    };
  };
  
  var sendResponse = function(response, resultObject){
    response.setHeader("Content-Type", "application/json");
    response.send(JSON.stringify(resultObject));

    //画面に表示するオプジェクトに変更する。
  };
  
  if (train.length > 0) {
    sendResponse(response, createResultObject('', train , ''));
  } else {
    sendResponse(response, createResultObject('', "エラー", ''));
  }

});



