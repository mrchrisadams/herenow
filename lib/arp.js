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

function Arp() {
  if(false === (this instanceof Arp)) {
    return new Arp();
  }
  events.EventEmitter.call(this);
}
sys.inherits(Arp, events.EventEmitter);

Arp.prototype.update = function(if_name) {
  var self = this;
  var spawn = require('child_process').spawn;
  var carrier = require('carrier');

  all_devices = []

  db.smembers("all_devices", function(err, devices){

    /* Store all MAC addresses */
    if (devices == null)
      all_devices = []
    else
      all_devices = devices
    
    /* Parse ARP data */
    console.log('scanning on interface ' + if_name);
    var arp  = spawn('arp', ['-i', if_name, '-lna']);
    
    line_wise_arp     = carrier.carry(arp.stdout);
           
    line_wise_arp.on('line', function (line) {

      var re = /([0-9]{1,3}\.?[0-9]{1,3}\.?[0-9]{1,3}\.?[0-9]{1,3})\s*([A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2})\s*(\w*)\s*(\w*)/;
      // 192.168.1.254           94:fe:f4:1b:f0:2e 13s       13s            en0    1 none unknown unknown unknown
      arr = re.exec(line);
      
      if (arr !== null){
        mac = arr[2];
        ip = arr[1];
        expiry_i = arr[3];
        expiry_o = arr[4];
        if (mac != 'ff:ff:ff:ff:ff:ff' && expiry_i != 'expired' && expiry_o != 'expired') {
          // Is this a new device?
          if (all_devices.indexOf(mac) == -1) {
            console.log(mac + ' appeared at ' + ip);
            // Add to devices list and store data
            db.sadd('all_devices',mac);
            db.hmset(mac, "mac", mac, "ip", ip);
            // Notify
            self.emit('connected', mac);
          }
          else {
            // Remove from list of known devices so we know it's present
            var index = all_devices.indexOf(mac);
            if(index!=-1) all_devices.splice(index, 1);
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
              });
            })(ip, mac);                    
          }
        }
      }
  
    });

    arp.on('exit', function (code) {
      console.log('child process exited with code ' + code);
      /* Anything left in the device list is not connected, so remove the IP */
      all_devices.forEach(function(mac){
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
      });
      /* Done */
      self.emit('complete');
    });

  });

}

module.exports = Arp;
