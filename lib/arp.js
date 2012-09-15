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
          // Remove from list of known devices so we know it's present
          var index = all_devices.indexOf(mac);
          if(index!=-1) all_devices.splice(index, 1);
          // Send device updated message
          self.emit('device_updated', mac, ip);
        }
      }
  
    });

    arp.on('exit', function (code) {
      console.log('child process exited with code ' + code);
      /* Anything left in the device list is not connected, so send update message without IP */
      all_devices.forEach(function(mac){
        self.emit('device_updated', mac, null);
      });
      /* Done */
      self.emit('complete');
    });

  });

}

module.exports = Arp;
