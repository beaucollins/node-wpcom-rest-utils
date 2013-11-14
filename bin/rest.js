#!/usr/bin/env node

var commands = [],
    stream = require('stream'),
    temp = require('temp'),
    format = require('util').format,
    events = require("events"),
    https = require("https"),
    url = require('url'),
    fs = require('fs'),
    config = require("../lib/wpcom/utils/config"),
    formatResponse = require('../lib/wpcom/cli/response-formatter'),
    commander = new events.EventEmitter,
    on = function(command, callback){
      commands.push(command)
      commander.on(command, callback);
    };

temp.track();

on("get", function(){
  arguments[2].unshift('get');
  request.apply(null, arguments);
});

on("post", function(){
  arguments[2].unshift('post');
  request.apply(null, arguments);
})

on("request", request);

function request(settings, options, args){

  var method = args.shift(),
      path = args.shift();

  if (!method) throw new Error("Missing request method: `request METHOD`");

  method = method.toLowerCase();

  if (!path) throw new Error("Missing request path: `request " + method + " PATH`");

  var request_options = url.parse(path);

  if (!(/^\/?rest\/v1\//).exec(request_options.path)){
    request_options.path = "/rest/v1/" + request_options.path.replace(/^\//, '');
  }

  request_options.headers = {};

  if (options.access_token) {
    request_options.headers['Authorization'] = "Bearer " + options.access_token;
  }

  request_options.host = "public-api.wordpress.com";
  request_options.method = method.toUpperCase();

  if (options.host) {
    request_options.headers['Host'] = request_options.host;
    request_options.host = options.host;
  }

  var tmp = temp.createWriteStream();

  process.stdin.pipe(tmp);

  var length = 0;
  process.stdin.on('data', function(data){
    length += data.length;
  });

  process.stdin.on('end', function(){

    if (length > 0) {
      request_options.headers['Content-Length'] = length;
    }

    var request = https.request(request_options), start = new Date();
    console.error(format("-> %s %s %s", request_options.method, request_options.path, request_options.host));
    request.on('response', function(response){
      console.error(format("<- %d (%s/%s)", response.statusCode, request_options.host, response.connection.remoteAddress));

      if (options['inspect-headers']) {
        for (name in response.headers) {
          console.error(name, ":", response.headers[name]);
        }
      }

      var body = "";

      if (process.stdout.isTTY) {
        formatResponse(response, process.stdout);
      } else {
        response.pipe(process.stdout);
      }

      response.on('end', function(){
        console.error(format("<- Completed in %d seconds ", ((new Date()).getTime() - start.getTime())/1000));
      });

    });

    if (process.stdin.isTTY) {
      request.end();
    } else {
      var buffer = fs.createReadStream(tmp.path);
      buffer.pipe(request);
    }

  });

  if (process.stdin.isTTY) {
    process.stdin.emit('end');
  } else {
    process.stdin.resume();    
  }

}

var cli = require('cli'),

    options = require('../lib/wpcom/cli/args')(cli, commands, {
      'host':            ['H', "Host sandbox address to send requests to", "string"],
      'inspect-headers': ['i', "Print response headers to STDERR", "boolean", false],
      'content-type':    ['c', "Content-Type of request body", "string", "application/json"]
    }),

    settings = config(options.config_file);

    process.stdin.pause();    

    commander.emit(cli.command, settings, settings.apply(options), cli.args);

try {
} catch (error) {
  cli.status(error.message, "error");
}

