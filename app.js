
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , herenow = require('./herenow/herenow');
  
var app = module.exports = express.createServer();


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

// Start web listener

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// Start network monitor

var Monitor = require('./lib/monitor.js');
var monitor = new Monitor();
monitor.start();

// Wire monitor events to event handlers

var DeviceIdentifier = require('./lib/device_identifier.js');
var device_identifier = new DeviceIdentifier();

monitor.on('connected', function (mac) {
  console.log("New device detected: " + mac);
  device_identifier.identify(mac);
});

monitor.on('reconnected', function (mac) {
  console.log("Known device detected: " + mac);
  device_identifier.identify(mac);
});

monitor.on('disconnected', function (mac) {
  console.log("Device disconnected: " + mac);
});