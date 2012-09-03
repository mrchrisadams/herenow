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

  var arp  = spawn('arp', [ '-na']);

  line_wise_arp     = carrier.carry(arp.stdout);

  line_wise_arp.on('line', function (line) {
  
        console.log('stdout: ' + line);    
  
    var re = /(\?) \(([0-9]{1,3}\.?[0-9]{1,3}\.?[0-9]{1,3}\.?[0-9]{1,3}\.?)\)( at )([A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{2}\:[A-Fa-f0-9]{2}\:[A-Fa-f0-9]{2}\:[A-Fa-f0-9]{2})/;
    // ? (192.168.1.1) at 0:26:b6:1e:61:5c on en1 ifscope [ethernet]
    arr = re.exec(line);


    if (arr !== null){
    
    console.log(arr[4]);
    console.log(arr[2])
    redis_client.hmset(arr[4], "mac", arr[4], "ip", arr[2])
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
    self.emit('complete');
  });


}

module.exports = Arp;
