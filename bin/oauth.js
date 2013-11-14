#!/usr/bin/env node
var oauth = require('wpcom-oauth');
var open = require('open');
var http = require('http');
var cli = require('cli');
var config = require('../lib/wpcom/utils/config');
var events = require('events');
var commands = [];
var commander = new events.EventEmitter();
var emit = events.EventEmitter.prototype.emit;
var on = function(name, callback){
  if (commands.indexOf(name) > -1){
    throw new Error("Command " + name + " already exists");
  }
  commands.push(name);
  commander.on(name, callback);
};


on('authorize', function(settings, options){

  var server = http.createServer(function(request, response){

    options.code = oauth.parseCode(request.url);

    oauth.requestToken(options, function(token){
      var formattedToken = JSON.stringify(token, null, "\t");

      response.writeHead(200, "Success", {
        'Content-Type':'application/json',
        'Content-Length': formattedToken.length
      });

      response.end(formattedToken);
      server.close();

      console.log("Token response ---");
      console.log(formattedToken);
      settings.set('access_token', token.access_token);
      process.exit();

    });

  });

  server.listen(3535);

  var authUrl = oauth.getAuthURL(options);

  open(authUrl);
  console.log("Go to:");
  console.log(authUrl);

});

on('token', function(settings, options, args){
  options.code = oauth.parseCode(args[0]);
  oauth.requestToken(options, function(){
    console.log.apply(console, arguments);
  });
});

var options = require('../lib/wpcom/cli/args')(cli, commands),
    settings = config(options.config_file);

commander.emit = function(){
  if (commands.indexOf(arguments[0]) > -1) {
    console.log.apply(console, arguments);
    emit.apply(this, arguments);
  }
};


process.on('exit', settings.save.bind(settings));

commander.emit(cli.command, settings, settings.apply(options), cli.args);

