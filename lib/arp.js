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

Arp.prototype.update = function(if_name, local_mac) {
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

    // Remove local mac from all_devices so we don't mark it disconnected
    console.log('local_mac ' + local_mac);
    var index = all_devices.indexOf(local_mac);
    if(index!=-1) all_devices.splice(index, 1);

    /* Parse ARP data */
    console.log('scanning on interface ' + if_name);
    var arp  = spawn('arp', ['-i', if_name, '-lna']);
    
    line_wise_arp     = carrier.carry(arp.stdout);
           
    line_wise_arp.on('line', function (line) {

      var re = /\(([0-9]{1,3}\.?[0-9]{1,3}\.?[0-9]{1,3}\.?[0-9]{1,3})\) at ([A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2})/;
      // (192.168.1.104) at 60:fa:cd:70:63:1e [ether] on eth1
      arr = re.exec(line);
      
      if (arr !== null){
        mac = arr[2];
        ip = arr[1];
        if (mac != 'ff:ff:ff:ff:ff:ff') {
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
        console.log('mac in all_devices: '+ mac);
        self.emit('device_updated', mac, null);
      });
      /* Done */
      self.emit('complete');
    });

  });

}

module.exports = Arp;
