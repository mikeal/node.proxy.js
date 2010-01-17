var sys = require("sys"),
   http = require("http");

/**
 * I wanted to make a couchdb proxy, so this is it
 */
http.createServer(
  function (client_request, client_response) {
    var path = client_request.url;
    var server = "127.0.0.1";
    var port = 5984;
    
    var c = http.createClient(port, server);
    var headers = client_request.headers;
    headers['host'] = server+':'+port;
    var proxy_request = c.request(client_request.method.toUpperCase(), path, headers);
    client_request.addListener("body", function(chunk) {
      proxy_request.sendBody(chunk);
    });
    
    proxy_request.finish(function (resp) {
      client_response.sendHeader(resp.statusCode, resp.headers);
 
      // Don't send binary unless it is necessary
      sendBinary = false;
      
      // Check to see if there are any images or gzip encodings to send
      try {
          if (resp.headers['content-encoding'] == 'gzip') {
            sendBinary = true;
          }      
      } catch (err) {
        // There is no content-encoding
      }
      try {
          if (resp.headers['content-type'].indexOf('image') != -1) {
            sendBinary = true;
          }
      } catch (err) {
        // There is no content-type
      }
      
      if (sendBinary) {
        resp.setBodyEncoding('binary');
        encoding = 'binary';
      } else {
        encoding = 'ascii';
      }
      
      resp.addListener("body", function(chunk) {
        client_response.sendBody(chunk, encoding);
      });
      resp.addListener("complete", function() {client_response.finish()});
    });
    }
  ).listen(8000);
sys.puts("Server running at http://127.0.0.1:8000/");
