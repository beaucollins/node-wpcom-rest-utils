module.exports = function(cli, commands, additional){

  var args = {
      config_file:   ['f', "JSON for storing `access_token`, `client_id`, `client_secret` and `redirect_uri`", "string", process.env.HOME + "/.wpcom-rest-utils.json"],
      access_token:  ['a', "Access token to use to authorize request", "string", process.env.WPCOM_CLIENT_ACCESS_TOKEN],
      client_id:     ['u', "WordPress.com Client ID", "string", process.env.WPCOM_CLIENT_ID],
      client_secret: ['p', "WordPress.com Client Secret", "string", process.env.WPCOM_CLIENT_SECRET],
      redirect_uri:  ['r', "WordPress.com App Redirect URI", "string", process.env.WPCOM_CLIENT_REDIRECT_URI]
  };

  if (additional) {
    for(var param in additional){
      args[param] = additional[param];
    }
  }

  return cli.parse(args, commands);

};
