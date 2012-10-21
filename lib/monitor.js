// The main monitor class that scans a network, and finds active devices

// Emits the following events:

// `stillconnected` - used to show devices persisting on a network

// `reconnected`    - used to show a recognised mac address being given a new ip address

// `disconnected`   - used when a device disppears from the network

// `connected`      - used for entirely new devices

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

Monitor.prototype.toString = function() {
  return "Monitor"
}

// Begin our loop of checking on the network every N seconds.

// We load in all the `Arp`, `Nmap` and `IfConfig`, the main objects
// to use together to scan the network, and work out ip addresses and macs.
Monitor.prototype.start = function() {
  var self = this;

  /* Set up monitor components */
  var IfConfig = require('./ifconfig.js')
  var ifconfig = new IfConfig();
  var Nmap = require('./nmap.js')
  var nmap = new Nmap();
  var Arp = require('./arp.js')
  var arp = new Arp();

  var local_mac = null;

  /* Set up monitor sequence */
  ifconfig.on('local_ip_found', function (ip, mac) {
    console.log(self.toString() + ': local ip: ' + ip);
    local_mac = mac;
    nmap.scan(ip);
  });

  // Once our call to the nmap binary as refreshed the arp
  // cache, trigger our arp call
  nmap.on('complete', function() {
    arp.update(monitor_config.interface_name, local_mac);
  });

  // Once our arp call is finished, we queue up the next call to `nmap`,
  // by calling the `probe_localhost` method on ifconfig, and waiting for the `local_ip_found`
  // it emits
  arp.on('complete', function () {
    setTimeout(function() {
      ifconfig.probe_localhost(monitor_config.interface_name);
    }, monitor_config.nmap_delay);
  }); 

  // This does the main housekeeping, updating redis, and deciding
  // what event to emit for each device on the network
  
  // mac - a String representing a mac address, like `2c:b0:5d:3:ff:df`
  // ip  - a String representing an ip address, like "192.168.0.1"
  function onDeviceUpdate(mac, ip) {
  
    db.smembers("all_devices", function(err, all_devices){

      // Is this device disconnected?
      if (ip == null) {
        (function(mac_addr) {
          db.hgetall(mac_addr, function(err, data) {
            // If there is an IP in redis, the device was recently connected
            if (data['ip'] != null) {
              console.log(self.toString() + ': ' + mac_addr + ' disconnected');
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

        console.log(self.toString() + ': ' + mac + ' appeared at ' + ip);

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
              console.log(self.toString() + ': ' + mac + ' reappeared at ' + ip);
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
  
  // This starts the process here, clearing ip addresses and services on each
  // device, then making the initial `ifconfig` call
  db.smembers("all_devices", function(err, devices) {
    // Reset connection state and services of all devices before we start
    for (i in devices) {      
      db.hdel(devices[i], "ip");
      db.hdel(devices[i], "services");
    }
    /* Start monitoring */
    ifconfig.probe_localhost(monitor_config.interface_name);
  });
  
}

module.exports = Monitor;
