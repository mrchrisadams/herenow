/*jslint  browser:  true,
            newcap:   true,
            nomen:    false,
            plusplus: false,
            undef:    true,
            vars:     false,
            indent:   2,
            sloppy:   true,
            white:    false */

var sys = require('util'),
    events = require('events');

var db = require('./db')

function Monitor() {
  if(false === (this instanceof Monitor)) {
    return new Monitor();
  }
  events.EventEmitter.call(this);
}
sys.inherits(Monitor, events.EventEmitter);

Monitor.prototype.start = function() {
  var self = this;

  /* Set up monitor components */
  var IfConfig = require('./ifconfig.js')
  var ifconfig = new IfConfig();
  var Nmap = require('./nmap.js')
  var nmap = new Nmap();
  var Arp = require('./arp.js')
  var arp = new Arp();

  /* Set up monitor sequence */
  ifconfig.on('complete', function (ip) {
    console.log('local ip: ' + ip);
    nmap.scan(ip);
  });

  nmap.on('complete', function() {
    console.log('nmap scan complete');
    db.hget('monitor', "interface", function(err, value) {
      arp.update(value);
    });
  });

  arp.on('complete', function () {
    console.log('arp update complete');
    db.hget('monitor', "delay", function(err, delay) {
      setTimeout(function() {
        db.hget('monitor', "interface", function(err, value) {
          ifconfig.find_ip(value);
        });
      }, delay);
      ifconfig.find_ip(delay);
    });
  }); 

  // Wire network events through to the outside world
  // New device appeared
  arp.on('connected', function (mac) {
    self.emit('connected', mac);
  }); 
  // Known device appeared
  arp.on('reconnected', function (mac) {
    self.emit('reconnected', mac);
  }); 
  // Known device is still here
  arp.on('stillconnected', function (mac) {
    self.emit('stillconnected', mac);
  }); 
  // Device gone away
  arp.on('disconnected', function (mac) {
    self.emit('disconnected', mac);
  }); 

  // Start process
  db.smembers("all_devices", function(err, devices) {
    // Reset connection state of all devices before we start
    for (i in devices) {      
      db.hdel(devices[i], "ip");
    }
    /* Set default values for monitor in redis and start monitoring */
    db.hget('monitor', "interface", function(err, value) {
      if (value == null) db.hset('monitor', "interface", "en0");
      db.hget('monitor', "delay", function(err, value) {
        if (value == null) db.hset('monitor', "delay", 30000);
        db.hget('monitor', "interface", function(err, value) {
          ifconfig.find_ip(value);
        });
      });
    });
  });
  
}

module.exports = Monitor;
