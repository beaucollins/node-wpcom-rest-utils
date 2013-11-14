var https = require('https');


module.exports = function(options){
  return new Client(options);
}

var Client = function(){
  throw new Error("Lol");
}

Client.prototype.request = function(options){

  var req = https.request(options, function(res){
    console.log("received response", res);
  });

}