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

redis_client = null;

function Arp(redis) {
  if(false === (this instanceof Arp)) {
    return new Arp(redis);
  }
  redis_client = redis;
  events.EventEmitter.call(this);
}
sys.inherits(Arp, events.EventEmitter);

Arp.prototype.update = function(local_ip) {
  var self = this;
  var spawn = require('child_process').spawn;
  var carrier = require('carrier');

  all_devices = []

  redis_client.smembers("all_devices", function(err, devices){
    
    /* Store all MAC addresses */
    if (devices == null)
      all_devices = []
    else
      all_devices = devices
    console.log(all_devices);
    
    /* Parse ARP data */
    var arp  = spawn('arp', [ '-na']);
    line_wise_arp     = carrier.carry(arp.stdout);
           
    line_wise_arp.on('line', function (line) {
  
      var re = /(\?) \(([0-9]{1,3}\.?[0-9]{1,3}\.?[0-9]{1,3}\.?[0-9]{1,3}\.?)\)( at )([A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{2}\:[A-Fa-f0-9]{2}\:[A-Fa-f0-9]{2}\:[A-Fa-f0-9]{2})/;
      // ? (192.168.1.1) at 0:26:b6:1e:61:5c on en1 ifscope [ethernet]
      arr = re.exec(line);

      if (arr !== null){    
        mac = arr[4];
        ip = arr[2]
        if (mac != 'ff:ff:ff:ff:ff:ff') {
          console.log(mac + ' is online at ' + ip);
          redis_client.sadd('all_devices',mac);
          redis_client.hmset(mac, "mac", mac, "ip", ip);
          /* Remove from list of devices so we know it's present */
          var index = all_devices.indexOf(mac);
          if(index!=-1) all_devices.splice(index, 1);
        }
      }
      else {
        console.log("empty string")
      }
  
    });

    // arp.stderr.on('data', function (data) {
    //   console.log('stderr: ' + data);
    // });

    arp.on('exit', function (code) {
      console.log('child process exited with code ' + code);
      /* Anything left in the device list is not connected, so remove the IP */
      all_devices.forEach(function(mac){
        console.log(mac+ ' is not online');
        redis_client.hdel(mac, "ip");
      });
      /* Done */
      self.emit('complete');
    });

  });

}

module.exports = Arp;
