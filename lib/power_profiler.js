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

var power_total = 0;
var storage_total = 0;

function PowerProfiler() {
  if(false === (this instanceof PowerProfiler)) {
    return new PowerProfiler();
  }
  events.EventEmitter.call(this);
  // Initialise power state to 0
  db.hmset('power_state', 'power', 0, 'storage', 0);
}
sys.inherits(PowerProfiler, events.EventEmitter);

// Power profiles
// power is in W, storage is in Wh

var power_profiles = {
  // Devices with storage
  'iPhone 4S'                 : { power:  0.53, storage:  5.3  }, // https://en.wikipedia.org/wiki/IPhone_4S
  'iPhone 4'                  : { power:  0.52, storage:  5.25 }, // https://en.wikipedia.org/wiki/IPhone_4
  'iPhone'                    : { power:  0.45, storage:  4.5  }, // https://en.wikipedia.org/wiki/IPhone_3GS
  'iPad 2'                    : { power:  2.5 , storage: 25    }, // https://www.apple.com/ipad/ipad-2/specs.html
  'iOS Device'                : { power:  0.52, storage:  5.25 }, // https://en.wikipedia.org/wiki/IPhone_4
  'HTC One'                   : { power:  0.55, storage:  5.5  }, // https://en.wikipedia.org/wiki/HTC_One
  'HTC Desire'                : { power:  0.52, storage:  5.2  }, // https://en.wikipedia.org/wiki/HTC_Desire
  'HTC Sensation'             : { power:  0.56, storage:  5.6  }, // https://en.wikipedia.org/wiki/HTC_Sensation
  'Macbook Pro 15" (Mid 2010)': { power: 25   , storage: 74    }, // Estimated from system information
  'Macbook Air 13"'           : { power: 15   , storage: 50    }, // https://www.apple.com/ie/macbookair/specs.html
  // Devices without storage
  'HP Photosmart'             : { power: 34 }, // Active power consumption (assuming active if on)
  "Linksys WRT54G"            : { power:  5 },
  "Pace Sky HD+"              : { power: 15 }, // Rough standby power consumption
  "Humax DTR-T1000"           : { power: 10 }, // 
  "Heatmiser PRT-TS Wifi RF"  : { power:  5 }, 
  "Mac Mini (Early 2009)"     : { power: 13 }, // Idle, from https://support.apple.com/kb/HT3468
  "WD MyBook World"           : { power: 10 },
  "XBox 360"                  : { power: 25 },
  "BT Home Hub 3"             : { power: 22 }, // Direct measurement including BT Infinity modem
  "Raspberry Pi"              : { power:  5 }, 
  "Airport Express"           : { power:  5 },
  // Generic types
  'printer'                   : { power: 30   },
  'set_top_box'               : { power: 10   },
  'networking'                : { power:  5   },
  'phone'                     : { power:  0.5 },
  'tablet'                    : { power:  2   },
};

PowerProfiler.prototype.update_device = function(mac, on) {
  var self = this;
  db.hgetall(mac, function(err, device_data) {
    power_profile = power_profiles[device_data.model||device_data.type];
    if (power_profile) {
      storage = power_profile.storage || 0;
      if (on) {
        console.log('adding power for ' + mac);
        power_total += power_profile.power;
        storage_total += storage;
        db.hmset('power_state', 'power', power_total, 'storage', storage_total);
        db.hmset(mac, 'power', power_profile.power, 'storage', storage); 
        self.emit('device_on', mac);
      }
      else {
        console.log('subtracting power for ' + mac);
        power_total -= power_profile.power;
        storage_total -= storage;
        db.hmset('power_state', 'power', power_total, 'storage', storage_total);
        db.hdel(mac, 'power');
        db.hdel(mac, 'storage');
        self.emit('device_off', mac);
      }
    }
    else {
      //console.log ('no power profile found for ' + device_data.model||device_data.type)
    }
  });
}

PowerProfiler.prototype.device_on = function(mac) {
  this.update_device(mac, true);
}

PowerProfiler.prototype.device_off = function(mac) {
  this.update_device(mac, false);
}

module.exports = PowerProfiler;
