var sys = require("sys"),
    http = require("http"),
    url = require("url");

var HttpPool = function (options) {
  this.options = options;
  this.clients = {};
}
HttpPool.prototype.getClient = function (port, hostname) {
  if (!this.clients[hostname+':'+port]) {
    var clients = [];
    this.clients[hostname+':'+port] = clients;
  } else {
    var clients = this.clients[hostname+':'+port];
  }
  for (i=0;i<clients.length;i+=1) {
    // TODO: Make this work
    if (clients[i].busy === false) {
      return clients[i];
    }
  }
  var c = http.createClient(port, hostname);
  c.busy = true;
  clients.push(c);
  return c;
}
pool = new HttpPool();

binaryContentTypes = ['application/octet-stream', 'application/ogg', 'application/zip', 'application/pdf',
                      'image/gif', 'image/jpeg', 'image/png', 'image/tiff', 'image/vnd.microsoft.icon',
                      'multipart/encrypted', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint',
                      'application/msword', 'application/x-dvi', 'application/x-shockwave-flash', 
                      'application/x-stuffit', 'application/x-rar-compressed', 'application/x-tar']

var guessEncoding = function (contentEncoding, contentType) {
  var encoding = "ascii";
  if (contentEncoding == 'gzip') {
    encoding = "binary";
  } else if (contentType) {
    if (contentType.slice(0,6) == 'video/' || contentType.slice(0,6) == 'audio/') {
      encoding = "binary";
    } else if (binaryContentTypes.indexOf(contentType) != -1) {
      encoding = "binary";
    }
  }
  return encoding;
}

var requestHandler = function (clientRequest, clientResponse) {
  var uri = url.parse(clientRequest.url);
  if (uri.port == undefined) {
    uri.port = {"http:":80,"https:":443}[uri.protocol]
  }
  var c = pool.getClient(uri.port, uri.hostname);
  var proxyRequest = c.request(clientRequest.method, uri.pathname, clientRequest.headers);
  proxyRequest.addListener("response", function (response) {
    clientResponse.writeHeader(response.statusCode, response.headers);
    var encoding = guessEncoding(response.headers['content-encoding'], response.headers['content-type']);
    response.setBodyEncoding(encoding)
    response.addListener("data", function (chunk) {
      clientResponse.write(chunk, encoding);
    })
    response.addListener("end", function () {
      clientResponse.close();
      c.busy = false;
    })
  })
  
  var encoding = guessEncoding(clientRequest.headers['content-encoding'], clientRequest.headers['content-type']);
  clientRequest.addListener("data", function (chunk) {
    proxyRequest.write(chunk, encoding);
  })
  clientRequest.addListener("end", function () {
    proxyRequest.close();
  })
  
}

var server = http.createServer(requestHandler);
server.listen(8000);
sys.puts("Server running at http://127.0.0.1:8000/")
