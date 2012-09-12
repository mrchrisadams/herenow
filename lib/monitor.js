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
    fs = require('fs'),
    events = require('events');

var db = require('./db')

// Load configuration
eval(fs.readFileSync('config/monitor.js', encoding="ascii"));

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
  ifconfig.on('local_ip_found', function (ip) {
    console.log('local ip: ' + ip);
    nmap.scan(ip);
  });

  nmap.on('complete', function() {
    console.log('nmap scan complete');
    arp.update(monitor_config.interface_name);
  });

  arp.on('complete', function () {
    console.log('arp update complete');
    setTimeout(function() {
      ifconfig.probe_localhost(monitor_config.interface_name);
    }, monitor_config.nmap_delay);
  }); 

  function onDeviceUpdate(mac, ip) {
  
    db.smembers("all_devices", function(err, all_devices){

      // Is this device disconnected?
      if (ip == null) {
        (function(mac_addr) {
          db.hgetall(mac_addr, function(err, data) {
            // If there is an IP in redis, the device was recently connected
            if (data['ip'] != null) {
              console.log(mac_addr+ ' disconnected');
              // Clear IP address
              db.hdel(mac_addr, "ip");
              // Notify
              self.emit('disconnected', mac);
            }
          });
        })(mac);
      }
      // Is this a new device?
      else if (all_devices.indexOf(mac) == -1) {
        console.log(mac + ' appeared at ' + ip);
        // Add to devices list and store data
        db.sadd('all_devices',mac);
        db.hmset(mac, "mac", mac, "ip", ip);
        // Notify
        self.emit('connected', mac);
      }
      else {
        // Check redis to see if this device is already connected
        (function(ip_addr, mac_addr) {
          db.hgetall(mac, function(err, data) {
            // If there is no IP in redis, the device isn't currently connected
            if (data['ip'] == null) {
              console.log(mac + ' reappeared at ' + ip);
              // Store IP address
              db.hmset(mac_addr, "ip", ip_addr);
              // Notify
              self.emit('reconnected', mac_addr);
            }
            else
            {
              // Nothing to store, but send a stillconnected message anyway
              self.emit('stillconnected', mac_addr);
            }
          });
        })(ip, mac);
      }
    });
  }

  // Store device data
  arp.on('device_updated', onDeviceUpdate);
  ifconfig.on('device_updated', onDeviceUpdate);
  
  // Start process
  db.smembers("all_devices", function(err, devices) {
    // Reset connection state of all devices before we start
    for (i in devices) {      
      db.hdel(devices[i], "ip");
    }
    /* Start monitoring */
    ifconfig.probe_localhost(monitor_config.interface_name);
  });
  
}

module.exports = Monitor;
