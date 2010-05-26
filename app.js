GLOBAL.DEBUG = true;

sys = require("sys"),
path = require('path'),
mongo = require('./lib/mongoose/mongoose').Mongoose;

// .... got sick of the git submodule madness of express
// express = require('./lib/express/lib/express');

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
