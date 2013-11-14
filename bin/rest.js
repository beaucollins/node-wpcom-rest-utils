#!/usr/bin/env node
var commands = [];
var stream = require('stream');
var temp = require('temp');
var format = require('util').format;
var events = require("events");
var https = require("https");
var url = require('url');
var fs = require('fs');
var config = require("../lib/wpcom/utils/config");
var formatResponse = require('../lib/wpcom/cli/response-formatter');
var commander = new events.EventEmitter();
var on = function(command, callback){
  commands.push(command);
  commander.on(command, callback);
};

var DEFAULT_HOST = 'public-api.wordpress.com';

temp.track();

on("get", function get(){
  arguments[2].unshift('get');
  request.apply(null, arguments);
});

on("post", function post(){
  arguments[2].unshift('post');
  request.apply(null, arguments);
});

on("request", request);

function request(settings, options, args){

  var method = args.shift();
  var path = args.shift();

  if (!method){
    throw new Error("Missing request method: `request METHOD`");
  }

  if (!path) {
    throw new Error("Missing request path: `request METHOD PATH`");
  }

  method = method.toUpperCase();

  var requestOptions = url.parse(path);

  requestOptions.method = method;

  // Check if a relative path was defined and prefix wit /rest/v1/
  if (!(/^\/?rest\/v1\//).exec(requestOptions.path)){
    requestOptions.path = "/rest/v1/" + requestOptions.path.replace(/^\//, '');
  }

  var headers = {};

  // Add access token to headers
  if (options.access_token) {
    headers.Authorization = "Bearer " + options.access_token;
  }

  // if custom host is present in the URL requested
  var definedHost = requestOptions.host &&
                    requestOptions.host !== "" &&
                    requestOptions.host !== DEFAULT_HOST;

  var customHost = definedHost ? requestOptions.host : options.host;

  if (customHost) {
    headers.host = DEFAULT_HOST;
    requestOptions.hostname = customHost;
    requestOptions.host = customHost;
  }

  requestOptions.headers = headers;

  var tmp = temp.createWriteStream();

  process.stdin.pipe(tmp);

  var length = 0;

  process.stdin.on('data', function countLength(data){
    length += data.length;
  });

  process.stdin.on('end', function onEnd(){

    if (length > 0) {
      requestOptions.headers['Content-Length'] = length;
    }

    var request = https.request(requestOptions), start = new Date();
    console.error(format("-> %s %s %s", requestOptions.method, requestOptions.path, requestOptions.hostname));
    request.on('response', function onResponse(response){
      console.error(format("<- %d (%s/%s)", response.statusCode, requestOptions.host, response.connection.remoteAddress));

      if (options['inspect-headers']) {
        for (var name in response.headers) {
          console.error(name, ":", response.headers[name]);
        }
      }

      var body = "";

      if (process.stdout.isTTY) {
        formatResponse(response, process.stdout);
      } else {
        response.pipe(process.stdout);
      }

      response.on('end', function onResponseEnd(){
        console.error(format("<- Completed in %d seconds ", ((new Date()).getTime() - start.getTime())/1000));
      });

    });

    if (process.stdin.isTTY) {
      request.end();
    } else {
      var buffer = fs.createReadStream(tmp.path);
      buffer.pipe(request);
    }

    request.on('error', function(e){
      cli.status(format("Could not connect to %s - %s", requestOptions.host, e.message), "fatal");
    });

  });

  if (process.stdin.isTTY) {
    process.stdin.emit('end');
  } else {
    process.stdin.resume();
  }

}

var cli = require('cli');
var options = require('../lib/wpcom/cli/args')(cli, commands, {
  'host':            ['H', "Host sandbox address to send requests to", "string"],
  'inspect-headers': ['i', "Print response headers to STDERR", "boolean", false],
  'content-type':    ['c', "Content-Type of request body", "string", "application/json"]
});
var settings = config(options.config_file);

process.stdin.pause();

try {
  commander.emit(cli.command, settings, settings.apply(options), cli.args);
} catch (error) {
  cli.status(error.message, "error");
}

