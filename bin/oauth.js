#!/usr/bin/env node
var oauth = require('wpcom-oauth'),
    open = require('open'),
    http = require('http'),
    cli = require('cli'),
    sys = require('sys'),
    config = require('../lib/wpcom/utils/config'),
    events = require('events'),
    commands = [],
    commander = new events.EventEmitter,
    emit = events.EventEmitter.prototype.emit,
    on = function(name, callback){
      if (commands.indexOf(name) > -1) throw new Error("Command " + name + " already exists");
      commands.push(name);
      commander.on(name, callback);
    }


on('authorize', function(settings, options, args){

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

    })

  });

  server.listen(3535);

  var auth_url = oauth.getAuthURL(options);
  open(auth_url);
  console.log("Go to:");
  console.log(auth_url);

});

on('token', function(settings, options, args){
  options.code = oauth.parseCode(args[0]);
  oauth.requestToken(options, function(){
    console.log.apply(console, arguments);
  })
});

var options = require('../lib/wpcom/cli/args')(cli, commands),
    settings = config(options.config_file);

commander.emit = function(){
  if (commands.indexOf(arguments[0]) > -1) {
    console.log.apply(console, arguments);
    emit.apply(this, arguments);
  }
}


process.on('exit', settings.save.bind(settings));

commander.emit(cli.command, settings, settings.apply(options), cli.args);

