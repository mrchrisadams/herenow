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
    events = require('events'),
    Services = require ('./services.js'),
    DeviceProfiles = require ('./device_profiles.js');

var db = require('./db')

function DeviceIdentifier() {
  if(false === (this instanceof DeviceIdentifier)) {
    return new DeviceIdentifier();
  }
  events.EventEmitter.call(this);
}
sys.inherits(DeviceIdentifier, events.EventEmitter);

DeviceIdentifier.prototype.toString = function() {
  return "DeviceIdentifier"
}

DeviceIdentifier.prototype.attempt_identification = function(mac) {
  var self = this;

  // Load data from redis for identification
  db.hgetall(mac, function(err, device) {
    // Get vendor MAC segment
    vendor_mac = device.mac.split(":",3).join(':');
    // Check against device profiles
    for(i in DeviceProfiles) {
      profile = DeviceProfiles[i];
      passed = true;
      // If there are specified mac ranges, check we're in them.
      if (profile.mac_ranges && profile.mac_ranges.indexOf(vendor_mac) == -1) {
        passed = false;
      }
      // If there are specified services, check we have them all. 
      if (profile.services) {
        if (device.services && device.services.length > 0) {
          for (i in profile.services) {
            required_service = profile.services[i];
            if (device.services.indexOf(required_service) == -1) {
              passed = false;
            }
          }
        }
        else
        {
          passed = false;
        }
      }
      // If we're still OK, store device details and emit device_identified
      if (passed == true) {
        // Detect changes
        var changed = false;
        if (device.type != profile.device.type)
          changed = true;
        if (device.model != profile.device.model)
          changed = true;
        // Update data if changed
        if (changed) {
          db.hmset(device.mac, profile.device);
          self.emit('device_identified', device.mac);
        }
        break;
      }
    }
  });
  
  
}

DeviceIdentifier.prototype.on('device_identified', function (mac) {
  var self = this;
    console.log(self.toString() + ': Device identified: ' + mac);
});

module.exports = DeviceIdentifier;
