
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , herenow = require('./herenow/herenow');
  
// Set up express server
var app = express();
app.configure(function(){
  app.use(express.static(__dirname + '/public'))
  app.set('view engine', 'jade');

  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.logger());
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/devices/:mac', routes.device);
app.post('/devices/:mac', function(req, res){
  routes.update_device(req, res);
  app.emit('device_updated', req.params['mac'])
});

// Start web listener

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", 3000, app.settings.env);
});

// Start network monitor

var Monitor = require('./lib/monitor.js');
var monitor = new Monitor();
monitor.start();

// Start mDNS browser
var MDNSBrowser = require('./lib/mdns_browser.js');
var mdns_browser = new MDNSBrowser();
mdns_browser.start();

// Wire monitor events to device identification

var PortScanner = require('./lib/port_scanner.js');
var port_scanner = new PortScanner();

var DeviceIdentifier = require('./lib/device_identifier.js');
var device_identifier = new DeviceIdentifier();

monitor.on('connected', function (mac) {
  console.log("Monitor: New device detected: " + mac);
  device_identifier.attempt_identification(mac);
  port_scanner.scan(mac);
});

monitor.on('reconnected', function (mac) {
  console.log("Monitor: Known device detected: " + mac);
  device_identifier.attempt_identification(mac);
  port_scanner.scan(mac);
});

monitor.on('disconnected', function (mac) {
  console.log("Monitor: Device disconnected: " + mac);
});

port_scanner.on('complete', function (mac) {
  device_identifier.attempt_identification(mac);
});

mdns_browser.on('updated', function (mac) {
  console.log("MDNSBrowser: mDNS services updated: " + mac);
  device_identifier.attempt_identification(mac);
});


app.on('device_updated', function (mac) {
  console.log("DeviceIdentifier: Device updated: " + mac);
});