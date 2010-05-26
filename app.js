GLOBAL.DEBUG = true;

sys = require("sys");
test = require("mjsunit");

var mongo = require('/home/james/Desktop/Work/HereNow/HereNow2/deps/node-mongodb-native/lib/mongodb');

var query = function(callback){
  var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
  var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : mongo.Connection.DEFAULT_PORT;
  var result;  
  sys.puts("Connecting to " + host + ":" + port);
  try {
    var db = new mongo.Db('test', new mongo.Server(host, port, {}), {});
  } catch (e) {
    sys.puts('Caught')
    return callback(e)
  }
  db.open(function(error, db) {
    if (error) callback(error)
    else {
      db.collection('foo', function(error, collection) {
        if (error) callback(error)
        else {
          collection.find(function(error, cursor) {
            if (error) callback(error)
            else {
              cursor.toArray(function(err, found) {
                sys.puts("Printing docs from Array")
                callback(null, found);
                found.forEach(function(item) {
                  sys.puts("Doc from Array " + sys.inspect(item));
                });
              });
            }
          });
        }
      });
    }
  });
};


//http = require('http')
//http.createServer(function(request, response) {
//  response.writeHead(200, {'Content-Type': 'text/html'});
//  query(function(error, result) {
//    if (error) {
//      response.end('Failed: '+error);
//    } else {
//      response.end('Success: '+result[0].a);
//    }
//  });
//}).listen(3000)

var kiwi = require('kiwi');
kiwi.require('express');



var generate_checksum = function () {
  // Hack for the timebeing
  return 'asdaioaufhawihqcn87t287iuwhrcc28p9q7n'
}

var keys = function(obj) {
    var output = '';
    for (item in obj) {
        output += item + ': '+obj[item]+'<br /> ';
    }
    return output;
}
//// This is a public page a user would visit
//var presence = function(req, resp){
//  var external_ip = req.environ['REMOTE_ADDR']
//  var checksum = generate_checksum();
//  db.query(
//    'INSERT INTO presence (checksum) VALUES (?);', 
//    (checksum),
//  )
//  var iframes = db.query(
//    'SELECT internal_ip FROM box WHERE external_ip = ?', 
//    (external_ip,)
//  )
//  return 'presence.html should be returned with checksum: '+checksum+' and frames: '+iframes
//}


var box = {
  box_id: 1,
  location: "Westminster",
  sublocation: "Flat 319",
  internal_ip: "192.168.1.75", 
}


get('/ip', function(){
  var self = this;
  this.contentType('html')
  return this.connection.remoteAddress
})

get('/:location/:sublocation', function(){
  var self = this;
  this.contentType('html')
  return this.param('location') + ' ' + this.param('sublocation')

  query(function(error, result) {
    if (error) {
      self.halt(500, 'Failed: '+error);
    } else {
      self.halt(200, 'Success: '+result[0].a);
    }
  });
})
run(3000, '0.0.0.0')
