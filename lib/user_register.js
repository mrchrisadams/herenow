// This object listens for events triggered by the Monitor , and
// updates the listed users accordingly, based on recognised devices in the system
// Nb: I'm not sure whether to fold this into another object or not - this may be a short lived
// piece of the system

// Events it emits

// online  - a person is assumed to be present
// offline - a person is assumed to no longer be around any more

// Events it listens for:

// * connected    - when a device is detected
// * reconnected  - when an existing device is detected
// * disconnected - when a device disappears from the network

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
    events = require('events'),
    dn = require('./db');

// This is a terrible name. 
// Please lets find a better one
function UserRegister() {
  if(false === (this instanceof UserRegister)) {
    return new UserRegister();
  }
  events.EventEmitter.call(this);
}
sys.inherits(UserRegister, events.EventEmitter);

UserRegister.prototype.toString = function() {
  return "UserRegister"
}

// Start listening for the three events, and use the `mac` to 
// update the database with information about users
UserRegister.prototype.start = function() {
  var self = this
  console.log(self.toString() + ': listening for users…');
}

// Look up device in Redis, and if we see an owner of it,
// add them to the array of present people in redis
UserRegister.prototype.checkin = function(mac) {
  var self = this
  console.log(self.toString() + ': checking if we have a device for ' + mac + ', to check someone IN');
  // check if mac exists in system
  
  // exit early if not
  
  // otherwise fetch full device object
  
    // then fetch user id/key, and put them into the 'present people' list
  
}

// Look up the device in Redis, and if we see an owner, check if they have 
// no other devices present that represent them, and if they don't ,
// assume they are no longer in the vicinity
UserRegister.prototype.checkout = function(mac) {
  var self = this
  console.log(self.toString() + ': checking if we have a device for ' + mac + ', to check someone OUT');
  // check if mac exists in system
  
  // exit early if not

  // fetch full device info from mac

    // fetch user id/key, and fetch full info object about them
    
    // check if in their list of devices they have any other devices listed in `present devices`
    
      // if so, do nothing
    
      // otherwise remove them from 'present' people list
}

module.exports = UserRegister;