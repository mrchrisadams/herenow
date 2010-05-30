var sys = require('sys'),
   http = require('http');

var kiwi = require('kiwi');
kiwi.require('express');
// Define our data structures

get('/', function(){
  var self = this;
  this.contentType('html')

  var render = function (result){
      self.halt("200", result)
  }
  var sandbox = {sys: sys, get: http, result: '', halt: render};
  var a = "var google = get.createClient(80, 'www.google.com'); \n"
  a +=    "var request = google.request('GET', '/',\n"
  a +=    "  {'host': 'www.google.com'});\n"
  a +=    "request.addListener('response', function (response) {\n"
  a +=    "  result += 'STATUS: ' + response.statusCode;\n"
  a +=    "  result += 'HEADERS: ' + JSON.stringify(response.headers);\n"
  a +=    "  response.setEncoding('utf8');\n"
  a +=    "  response.addListener('data', function (chunk) {\n"
  a +=    "    result += 'BODY: ' + chunk;\n"
  a +=    "  });\n"
  a +=    "  response.addListener('end', function () {\n"
  a +=    "    sys.puts('Ended');\n"
  a +=    "    halt(result);\n"
  a +=    "    sys.puts('And halted');\n"
  a +=    "  });\n"
  a +=    "  response.addListener('error', function (error) {\n"
  a +=    "    sys.puts('Failed')\n";
  a +=    "    halt('Failed '+error);\n"
  a +=    "  });\n"
  a +=    "});\n"
  a +=    "request.end();"
  try{
    process.binding("evals").Script.runInNewContext(a, sandbox);
  } catch (err) {
    sys.puts("Failed here");
    self.halt('200', 'Failed'+err);
  }
  //self.halt('200', 'Passed');
})

run(3000, '0.0.0.0')

