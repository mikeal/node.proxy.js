var sys = require("sys");
var http = require("http");
http.createServer(
  function (client_request, client_response) {
    var r = client_request.uri.full.split('://')[0];
    var path = client_request.uri.full.replace(r+'://','', 1);
    var server = path.split('/')[0];
    var path = path.replace(server,'',1);
    if (server.indexOf(':') != -1) {
      var server = server.split(':');
      var port = parseInt(server[1]);
      var server = server[0];
    } else {
      var port = 80;
    }
    
    var c = http.createClient(port, server);    
    var headers = client_request.headers;
    headers['host'] = server+':'+port;
    var proxy_request = c[client_request.method.toLowerCase()](path, headers);
    client_request.addListener("body", function(chunk) {
      proxy_request.sendBody(chunk);
    });
    
    proxy_request.finish(function (resp) {
      client_response.sendHeader(resp.statusCode, resp.headers);

      encoding = resp.headers['content-encoding'];
      if (resp.headers['content-encoding'] == 'gzip' || resp.headers['content-type'].indexOf('image') != -1) {
        resp.setBodyEncoding('binary');
        encoding = 'binary';
      }
      
      resp.addListener("body", function(chunk) {
        client_response.sendBody(chunk, encoding);
      });
      resp.addListener("complete", function() {client_response.finish()});
    });
    }
  ).listen(8000);
sys.puts("Server running at http://127.0.0.1:8000/");

