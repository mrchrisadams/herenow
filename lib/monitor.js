/*jslint  browser:  true,
            newcap:   true,
            nomen:    false,
            plusplus: false,
            undef:    true,
            vars:     false,
            indent:   2,
            sloppy:   true,
            white:    false */

/* Set up redis client */
var redis = require("redis");
var redis_client = redis.createClient();  

/* Set up monitor components */
var IfConfig = require('./ifconfig.js')
var ifconfig = new IfConfig();
var Nmap = require('./nmap.js')
var nmap = new Nmap();
var Arp = require('./arp.js')
var arp = new Arp(redis_client);

/* Set up monitor sequence */
ifconfig.on('complete', function (ip) {
  console.log('local ip: ' + ip);
  nmap.scan(ip);
});

nmap.on('complete', function() {
  console.log('nmap scan complete');
  arp.update();
});

arp.on('complete', function () {
  console.log('arp update complete');
  redis_client.hget('monitor', "delay", function(err, delay) {
    setTimeout(function() {
      redis_client.hget('monitor', "interface", function(err, value) {
        ifconfig.find_ip(value);
      });
    }, delay);
    ifconfig.find_ip(delay);
  });
}); 

/* Set default values for monitor in redis and start monitoring */
redis_client.hget('monitor', "interface", function(err, value) {
  if (value == null) redis_client.hset('monitor', "interface", "en0");
  redis_client.hget('monitor', "delay", function(err, value) {
    if (value == null) redis_client.hset('monitor', "delay", 30000);
    redis_client.hget('monitor', "interface", function(err, value) {
      ifconfig.find_ip(value);
    });
  });
});