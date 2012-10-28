// Example User attributes
// {
//   name: "Chris Adams"
//   username: "mrchrisadams"
//   devices: [00:1e:c2:a4:d3:5e]
//   email_address: wave@chrisadams.me.uk
//   gravatar: url at a given size
// }

var sys = require('util'),
    fs = require('fs'),
    events = require('events'),
    db = require('../../lib/db');

function User() {
  if(false === (this instanceof User)) {
    return new User();
  }
  events.EventEmitter.call(this);
}
sys.inherits(User, events.EventEmitter);

User.prototype.toString = function() {
  return "User"
}

// Tries to find the corresponding user for the device mac passed in, after checking we have this mac
// registered first

// device_mac - the String representing the mac address we're using as a key, like `'00:1e:c2:a4:d3:5e'`

User.prototype.findByDevice = function(device_mac, callback) {


  db.hgetall(device_mac, function (err, device) {
    if (err) { console.log(err) }
    else {
      if (device.hasOwnProperty('mac')) { 
        db.hgetall(device.owner, function (err, user) {
          if (err) { console.log(err)}
          else{
            callback(err , user)
          }
        });
      }
    }
  });
}

module.exports = User;