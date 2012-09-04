/*jslint  browser:  true,
            newcap:   true,
            nomen:    false,
            plusplus: false,
            undef:    true,
            vars:     false,
            indent:   2,
            sloppy:   true,
            white:    false */

var db = require('./db')

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

/* Set default values for monitor in redis and start monitoring */
db.hget('monitor', "interface", function(err, value) {
  if (value == null) redis_client.hset('monitor', "interface", "en0");
  db.hget('monitor', "delay", function(err, value) {
    if (value == null) redis_client.hset('monitor', "delay", 30000);
    db.hget('monitor', "interface", function(err, value) {
      ifconfig.find_ip(value);
    });
  });
});