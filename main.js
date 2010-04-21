var sys = require("sys"),
    http = require("http"),
    url = require("url");

var requestHandler = function (clientRequest, clientResponse) {
  var uri = url.parse(clientRequest.url);
  if (uri.port == undefined) {
    uri.port = {"http:":80,"https:":443}[uri.protocol]
  }
  var pathname = uri.search ? uri.pathname + uri.search : uri.pathname
  sys.puts(pathname)
  var c = http.createClient(uri.port, uri.hostname);
  var proxyRequest = c.request(clientRequest.method, pathname, clientRequest.headers);
  proxyRequest.addListener("response", function (response) {
    clientResponse.writeHeader(response.statusCode, response.headers);
    response.addListener("data", function (chunk) {
      clientResponse.write(chunk, 'binary');
    })
    response.addListener("end", function () {
      clientResponse.end();
    })
  })
  
  clientRequest.addListener("data", function (chunk) {
    proxyRequest.write(chunk, 'binary');
  })
  clientRequest.addListener("end", function () {
    proxyRequest.end();
  })
  
}

var server = http.createServer(requestHandler);
server.listen(8000);
sys.puts("Server running at http://127.0.0.1:8000/")
