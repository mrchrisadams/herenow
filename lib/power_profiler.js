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

function PowerProfiler() {
  if(false === (this instanceof PowerProfiler)) {
    return new PowerProfiler();
  }
  events.EventEmitter.call(this);
  // Initialise power state to 0
  db.hmset('power_state', 'power', 0, 'storage', 0);
}
sys.inherits(PowerProfiler, events.EventEmitter);

var power_profiles = {
  // Devices with storage
  'iPhone 4S'                 : { power:  2, storage:  0.2 },
  'iPhone'                    : { power:  2, storage:  0.2 },
  'iPad'                      : { power:  4, storage:  0.4 },
  'iOS Device'                : { power:  3, storage:  0.3 },
  'HTC One'                   : { power:  2, storage:  0.2 },
  'HTC Desire'                : { power:  2, storage:  0.2 },
  'HTC Sensation'             : { power:  2, storage:  0.2 },
  'Macbook Pro'               : { power: 20, storage: 20   },
  'Macbook Air'               : { power: 15, storage: 15   },
  // Devices without storage
  'HP Photosmart'             : { power: 10 },
  "Linksys WRT54G"            : { power:  5 },
  "Pace Sky HD+"              : { power: 20 },
  "Humax DTR-T1000"           : { power: 20 },
  "Heatmiser PRT-TS Wifi RF"  : { power:  5 },
  "Mac Mini"                  : { power: 20 },
  "WD MyBook World"           : { power: 10 },
  "XBox 360"                  : { power: 25 },
  "BT Home Hub 3"             : { power:  5 },
  "Raspberry Pi"              : { power:  5 },
  "Airport Express"           : { power:  5 },
  // Generic types
  'printer'                   : { power: 10 },
  'networking'                : { power:  5 },
  'phone'                     : { power:  2 },
  'tablet'                    : { power:  4 },
};

function update_device(mac, on) {
  db.hgetall('power_state', function(err, power_state) {
    db.hgetall(mac, function(err, device_data) {
      power_profile = power_profiles[device_data.model||device_data.type];
      storage = power_profile.storage || 0;
      if (on)
        db.hmset('power_state', 'power', parseFloat(power_state.power) + power_profile.power, 'storage', parseFloat(power_state.storage) + storage);
      else 
        db.hmset('power_state', 'power', parseFloat(power_state.power) - power_profile.power, 'storage', parseFloat(power_state.storage) - storage); 
    });
  });
}

PowerProfiler.prototype.device_on = function(mac) {
  update_device(mac, true);
}

PowerProfiler.prototype.device_off = function(mac) {
  update_device(mac, false);
}

module.exports = PowerProfiler;
