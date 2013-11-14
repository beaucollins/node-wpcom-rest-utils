var formats = [],
    util = require('util');

module.exports = function(response, output){
  // figure out wich formatter to pick and output
  var formatters = formats.filter(function(set){
    return set[0](response);
  });

  if (formatters.length > 0) {
    formatters[0][1](response, output);
    return;
  }

  console.error("No formatter for", response.headers['content-type']);

}

function format(matcher, formatter){
  if (util.isRegExp(matcher)) {
    var expression = matcher;
    matcher = function(response){
      return expression.exec(response.headers['content-type']);
    }
  } else if (typeof(matcher) == 'string') {
    var type = matcher;
    matcher = function(response){
      return response.headers['content-type'] == type;
    }
  }
  formats.push([matcher, formatter]);
}

format(/\/json/, function(response, output){
  var json = "";
  response.on('data', function(data){
    json += data.toString();
  });

  response.on('end', function(){
    output.write("\n");
    output.write(JSON.stringify(JSON.parse(json), null, "  ") + "\n");
    output.write("\n");
  });

});

format(/^text\/plain;?/, function(response, output){
  response.pipe(output);
});