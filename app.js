GLOBAL.DEBUG = true;

var sys = require("sys"),
    path = require('path'),
    Mongoose = require('./lib/mongoose/mongoose').Mongoose,
    db = Mongoose.connect('mongodb://localhost/test'); // connect to mongo
    Foo = Mongoose.noSchema('foo',db); // no model, direct access to 'simple' collection.


var kiwi = require('kiwi');
kiwi.require('express');

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
  Foo.find().gt(
      {a: 1}
  ).each(
      function(doc){
          self.halt('200', ' '+doc.a);
      }
  );
})

run(3000, '0.0.0.0')
