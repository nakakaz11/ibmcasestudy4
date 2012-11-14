
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

// fix sw
// Generated by CoffeeScript 1.4.0
var combinedSearch, doSearch, fetchPage, fs, googleSearch, serveStatic, server, url, twitterSearch;

//http = require("http");

fetchPage = function(host, port, path, callback) {
  var options, req;
  options = {
    host: host,
    port: port,
    path: path
  };
  req = http.get(options, function(res) {
    var contents;
    contents = "";
    res.on('data', function(chunk) {
      return contents += "" + chunk;
    });
    return res.on('end', function() {
      return callback(contents);
    });
  });
  return req.on("error", function(e) {
    return console.log("Erorr: {e.message}");
  });
};

googleSearch = function(keyword, callback) {
  var host, path;
  host = "ajax.googleapis.com";
  path = "/ajax/services/search/web?v=1.0&q=" + (encodeURI(keyword));
  return fetchPage(host, 80, path, callback);
};

twitterSearch = function(keyword, callback) {
  var host, path;
  host = "search.twitter.com";
  path = "/search.json?q=" + (encodeURI(keyword));
  return fetchPage(host, 80, path, callback);
};

combinedSearch = function(keyword, callback) {
  var data;
  data = {
    google: "",
    twitter: ""
  };
  googleSearch(keyword, function(contents) {
    contents = JSON.parse(contents);
    data.google = contents.responseData.results;
    if (data.twitter !== "") {
      return callback(data);
    }
  });
  return twitterSearch(keyword, function(contents) {
    contents = JSON.parse(contents);
    data.twitter = contents.results;
    if (data.google !== "") {
      return callback(data);
    }
  });
};


fs = require("fs");

serveStatic = function(uri, response) {
  var fileName;
  fileName = path.join(process.cwd(), uri);
  return path.exists(fileName, function(exists) {
    if (!exists) {
      response.writeHead(404, {
        'Content-Type': 'text/plain'
      });
      response.end("404 Not Found " + uri + "!\n");
      return;
    }
    return fs.readFile(fileName, "binary", function(err, file) {
      if (err) {
        response.writeHead(500, {
          'Content-Type': 'text/plain'
        });
        response.end("Error " + uri + ": " + err + " \n");
        return;
      }
      response.writeHead(200);
      response.write(file, "binary");
      return response.end();
    });
  });
};

doSearch = function(uri, response) {
  var keyword, params, query;
  query = uri.query.split("&");
  params = {};
  query.forEach(function(nv) {
    var nvp;
    nvp = nv.split("=");
    return params[nvp[0]] = nvp[1];
  });
  keyword = params["q"];
  return combinedSearch(keyword, function(results) {
    response.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    return response.end(JSON.stringify(results));
  });
};

// いまのところここだけJS
url = require("url");
server = http.createServer(app,function(request, response) {

  var uri;
  //uri = url.parse(request.url);

  console.log("testSW " + url );

  if (uri.pathname === "/doSearch") {
    return doSearch(uri, response);
  } else {
    return serveStatic(uri.pathname, response);
  }
});
server.listen(app.get('port'), function(){
  console.log("SW port " + app.get('port'));
});
/*
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
*/
