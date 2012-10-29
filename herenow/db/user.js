// Example User attributes
// 
//      {
//        name: "Chris Adams"
//        username: "mrchrisadams"
//        devices: [00:1e:c2:a4:d3:5e]
//        email_address: wave@chrisadams.me.uk
//        gravatar: url at a given size
//      }

var sys = require('util'),
    fs = require('fs'),
    events = require('events'),
    db = require('../../lib/db'),
    async = require('async')
    Device = require('./device')

    var device = new Device()

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

// * device_mac - the String representing the mac address we're using as a key, like `'00:1e:c2:a4:d3:5e'`
// * callback - the Function that is called to pass along values, accepting two arguments, `err` and `res`.

User.prototype.findByDevice = function(device_mac, callback) {

  // use waterfall to ensure the result of each function 
  // is passed along to the next call
  async.waterfall([
      // fetch our device first
      function(cb){
        device.findByMac(device_mac, function (err, res) {
          cb(null, res);
        })
      },
      // new we have our device, fetch the user
      function(device, cb){
        db.hgetall(device.owner, function (err, res) {
          cb(err, res);
        })
      }
      // return our user object 
    ], function (err, user) {
      callback(err, user)
    });
  }

// export our user
module.exports = User;