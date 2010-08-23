GLOBAL.DEBUG = true;

var sys = require("sys"),
  path = require('path'),
  Mongoose = require('./lib/mongoose/mongoose').Mongoose,
  db = Mongoose.connect('mongodb://localhost/test'), // connect to mongo
  Foo = Mongoose.noSchema('foo',db), // no model, direct access to 'simple' collection.
  url = require('url'),
  Mustache = require('mustache'),
  fs = require('fs'),
  http = require('http');

var box = {
  box_id: 1,
  location: "Westminster",
  sublocation: "Flat 319",
  internal_ip: "192.168.1.75", 
  external_ip: "188.40.40.131",
  actually_present: ['james'],
  presence: [
    {
      username: 'james', 
      checksum: 'sdfasdfadfsasdf',
      tags: ['#carbon'],
      callbacks: [],
      presence_stats: {},
    },
    {
      username: 'chris', 
      checksum: 'adsadasdasdfrt34',
      tags: [],
      callbacks: [
          //ping_me_when_james_enters, 
          //send_james_this_email_when_james_enters_and_remove_this_callback
      ],
      presence_stats: {},
    },
  ]
}

callback_api = 'expires, number_of_runs=0'
var people = [ 
  {
    username: 'james',
    firstname: 'James',
    lastname: 'Gardner',
    tags : ['#cheese'],
    mac: [],
  },
  {
    username: 'chris',
    firstname: 'Chris',
    lastname: 'Adams',
    mac: [],
  },
]

// Model

var get_box = function (location, sublocation) {
  //Foo.find().gt(
  //    {a: 1}
  //).each(
  //    function(doc){
  //        self.halt('200', ' '+doc.a);
  //    }
  //);
  return box
}
var get_people = function(box) {
    p = []
    for (var i=0; i<box.presence.length; i++) {
        person = box.presence[i].username
        p.push(people[i])
    }
    return people
}

var generate_checksum = function () {
  // Hack for the timebeing
  return 'asdaioaufhawihqcn87t287iuwhrcc28p9q7n'
}

var keys = function(obj) {
    var output = '';
    for (item in obj) {
        if (obj.hasOwnProperty(item) ) {
            output += item + ': '+obj[item]+'<br /> ';
        }
    }
    return output;
}


var server = http.createServer(function (request, response) {
  switch(url.parse(request.url).pathname)
  {
  case '/ip':
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end(request.connection.remoteAddress+'\n');
    break;
  case '/location/sublocation':
    //var result = Mustache.to_html('Hello {{name}}!', {name: 'james'});
    //response.writeHead(200, {'Content-Type': 'text/html'})
    //response.write(result);
    //response.end()
    fs.readFile('people.html', function (err, data) {
      if (err) throw err;
      var vars = {name: 'Chris'}
      response.writeHead(200, {'Content-Type': 'text/html'})
      var result = Mustache.to_html(data.toString('utf8', 0, data.length), vars);
      response.write(result+sys.inspect(all_macs));
      response.end()
    });
    break;
  default:
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.end('Not found\n'+url.parse(request.url).pathname);
  }
}).listen(8001);



spawn = require('child_process').spawn;
// then spawn our tcp dump
tcpdump = spawn('sudo', ['tcpdump', '-e', '-i', 'eth2']);

var exitStatus = 0;
var response = "";
var responseCount = 0;
var errCount = 0
var gotStdoutEOF = false;

tcpdump.stdout.setEncoding('utf8');

// first provide out put for 'good' output

var all_macs = [];
tcpdump.stdout.addListener('data', function(chunk){
  responseCount += 1;
  sys.puts('.');
  lines = chunk.split('\n');
  var mac_address_pattern, mline, i, mac, found;
  for (var i=0, lines; line = lines[i]; i++){
    // create absurd regexp to match against for each line
    mac_address_pattern = /.*([0-9]{2}:[0-9a-z]{2}:[0-9a-z]{2}:[0-9a-z]{2}:[0-9a-z]{2}:[0-9a-z]{2})/;
    mline = line.match(mac_address_pattern)
    if (mline) {
      mac = mline[1];
      if (mac) {
        //sys.puts("[" + i + '] - mac is ' + mac);  
        found = false;
        for (j=0; j<all_macs.length; j+=1) {
           if (mac === all_macs[j]) {
              found = true;
              break;
           }
        }
        if (!found) {
          sys.puts("Adding mac "+mac+"all: "+sys.inspect(all_macs));
          all_macs.push(mac);
        } else {
          sys.puts("Ignoring mac "+mac+"all: "+sys.inspect(all_macs));
        }
      }
    }
  }
// 
});
// TODO - add callback for when we kill this. 
// It may simplty be that this needs to be the global process instead of the child process to get our text dump.

//tcpdump.stdout.addListener('end', function(chunk){
//    tpcdumplog = fs.openSync('tcddump.dump', 'w+');
//    fs.writeSync(tpcdumplog, response);
//    fs.closeSync('tpcdumplog');
//    gotStdoutEOF = true;
//});

// we now list error output too
tcpdump.stderr.addListener('data', function(chunk){
  errCount += 1;
  sys.puts("stderr: " + chunk);
  response["sterr-" +errCount] = chunk;
});

tcpdump.stderr.addListener('end', function(chunk){
  sys.puts("stderr: " + chunk);
  gotstderrEOF = true;
});


