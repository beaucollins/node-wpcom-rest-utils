var fs = require("fs");

module.exports = function(path){
  return new Config(path);
}

var Config = module.exports.Config = function(path){
  this.path = path;
  try {
    this.config = JSON.parse(fs.readFileSync(this.path));
  } catch (e) {
    console.warn("Unable to read config", this.path, e);
  }

  if (!this.config) this.config = {};
}

Config.prototype.get = function(key, defaultValue){
  return this.config[key] || defaultValue;
}

Config.prototype.set = function(key, value){
  return this.config[key] = value;
}

Config.prototype.apply = function(from){
  return [this.config, from].reduce(function(applied, options){
    for(key in options){
      if(options[key] !== undefined && options[key] !== null) applied[key] = options[key];
    }
    return applied;
  }, {});
}

Config.prototype.save = function(){

  console.log("Saving");

  var buffer = new Buffer(JSON.stringify(this.config, null, "  "));

  try {
    fs.writeFileSync(this.path, buffer);
  } catch (e) {
    console.error("Could not save config", e);
  }
}