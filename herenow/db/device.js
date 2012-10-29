// Example Device attributes
// 
//      {
//        mac: 00:1e:c2:a4:d3:5e # this doesn't change, but shouldn't be exposed, hence the guid
//        ip: 192.145.6.4 # this will change
//        first_appeared: # timestamp, no reason not to use unix 
//        owner: "mrchrisadams"
//        guid: (RFC generated)
//        status: online, offline, 
//      }
//   
var sys = require('util'),
    fs = require('fs'),
    events = require('events'),
    db = require('../../lib/db'),
    async = require('async')
    

function Device() {
  if(false === (this instanceof Device)) {
    return new Device();
  }
  events.EventEmitter.call(this);
}
sys.inherits(Device, events.EventEmitter);

Device.prototype.toString = function() {
  return "Device"
}


// Tries to find the device for the mac address string passed in

// * device_mac - the String representing the mac address we're using as a key, like `'00:1e:c2:a4:d3:5e'`
// * callback - the Function that is called to pass along values, accepting two arguments, `err` and `res`.

Device.prototype.findByMac = function(device_mac, callback) {
  db.hgetall(device_mac, function(err, res) {
    callback(err, res);
  })
}
// export our user
module.exports = Device;