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
    var arp  = spawn('arp', ['-i', if_name, '-lxna']);
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
          console.log(mac + ' is online at ' + ip);
          db.sadd('all_devices',mac);
          db.hmset(mac, "mac", mac, "ip", ip);
          /* Remove from list of devices so we know it's present */
          var index = all_devices.indexOf(mac);
          if(index!=-1) all_devices.splice(index, 1);
        }
      }
  
    });

    arp.on('exit', function (code) {
      console.log('child process exited with code ' + code);
      /* Anything left in the device list is not connected, so remove the IP */
      all_devices.forEach(function(mac){
        console.log(mac+ ' is not online');
        db.hdel(mac, "ip");
      });
      /* Done */
      self.emit('complete');
    });

  });

}

module.exports = Arp;
