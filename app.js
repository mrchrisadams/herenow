GLOBAL.DEBUG = true;

var sys = require("sys"),
    path = require('path'),
    Mongoose = require('./lib/mongoose/mongoose').Mongoose,
    db = Mongoose.connect('mongodb://localhost/test'); // connect to mongo
    Foo = Mongoose.noSchema('foo',db); // no model, direct access to 'simple' collection.

var kiwi = require('kiwi');
kiwi.require('express');
// Define our data structures

var box = {
  box_id: 1,
  location: "Westminster",
  sublocation: "Flat 319",
  internal_ip: "192.168.1.75", 
  external_ip: "188.40.40.131",
  presense: [
    {username: 'james', checksum: 'sdfasdfadfsasdf'},
    {username: 'chris', checksum: 'adsadasdasdfrt34'},
  ]
}

var people = [ 
  {
    username: 'james',
    firstname: 'James',
    lastname: 'Gardner',
  },
  {
    username: 'chris',
    firstname: 'Chris',
    lastname: 'Adams',
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
    for (var i=0; i<box.presense.length; i++) {
        person = box.presense[i].username
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

get('/ip', function(){
  var self = this;
  this.contentType('html')
  return this.connection.remoteAddress
})

get('/:location/:sublocation', function(){
  var self = this;
  this.contentType('html')
  this.render('people.html.haml', {
    layout: false,
    locals: {
      title: 'People in '+this.param.location+'/'+this.param.sublocation,
      people: people
    }
  })
})

run(3000, '0.0.0.0')
