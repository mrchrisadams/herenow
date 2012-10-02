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
    http = require('http'),
    Services = require('./services');

var db = require('./db')

var power_total = 0;
var storage_total = 0;

function PowerProfiler() {
  if(false === (this instanceof PowerProfiler)) {
    return new PowerProfiler();
  }
  events.EventEmitter.call(this);
  // Initialise all power states to 0
  db.hmset('power_state', 'power', 0, 'storage', 0);
  db.smembers("all_devices", function(err, devices) {
    for (i in devices) {      
      db.hdel(devices[i], "power");
      db.hdel(devices[i], "storage");
    }
  });
}
sys.inherits(PowerProfiler, events.EventEmitter);

// Power profiles
// power is in W, storage is in Wh

var power_profiles = {
  // Devices with storage
  'iPhone 4S'                 : { power:   0.53, storage:  5.3  }, // https://en.wikipedia.org/wiki/IPhone_4S
  'iPhone 4'                  : { power:   0.52, storage:  5.25 }, // https://en.wikipedia.org/wiki/IPhone_4
  'iPhone'                    : { power:   0.45, storage:  4.5  }, // https://en.wikipedia.org/wiki/IPhone_3GS
  'iPad 2'                    : { power:   2.5 , storage: 25    }, // https://www.apple.com/ipad/ipad-2/specs.html
  'iOS Device'                : { power:   0.52, storage:  5.25 }, // https://en.wikipedia.org/wiki/IPhone_4
  'HTC One'                   : { power:   0.55, storage:  5.5  }, // https://en.wikipedia.org/wiki/HTC_One
  'HTC Desire'                : { power:   0.52, storage:  5.2  }, // https://en.wikipedia.org/wiki/HTC_Desire
  'HTC Sensation'             : { power:   0.56, storage:  5.6  }, // https://en.wikipedia.org/wiki/HTC_Sensation
  'Macbook Pro 15" (Mid 2010)': { power:  25   , storage: 74    }, // Estimated from system information
  'Macbook Air 13"'           : { power:  15   , storage: 50    }, // https://www.apple.com/ie/macbookair/specs.html
  // Devices without storage
  'HP Photosmart'             : { power:  34 }, // Active power consumption (assuming active if on)
  "Linksys WRT54G"            : { power:   5 },
  "Pace Sky HD+"              : { power:  15 }, // Rough standby power consumption
  "Humax DTR-T1000"           : { power:  10 }, // 
  "Heatmiser PRT-TS Wifi RF"  : { power:   5 }, 
  "Mac Mini (Early 2009)"     : { power:  13 }, // Idle, from https://support.apple.com/kb/HT3468
  "WD MyBook World"           : { power:  10 },
  "XBox 360"                  : { power: 150 },
  "BT Home Hub 3"             : { power:  22 }, // Direct measurement including BT Infinity modem
  "Raspberry Pi"              : { power:   5 }, 
  "Airport Express"           : { power:   5 },
  // Generic types
  'console'                   : { power: 150   },
  'laptop'                    : { power:  45  , storage: 50 },
  'computer'                  : { power: 110   },
  'printer'                   : { power:  30   },
  'set_top_box'               : { power:  10   },
  'networking'                : { power:   5   },
  'phone'                     : { power:   0.5 },
  'tablet'                    : { power:   2   },
};

PowerProfiler.prototype.device_on = function(mac) {
  var self = this;

  // Get data from redis
  db.hgetall(mac, function(err, device_data) {
    // Get power monitor status if available
    if (device_data.services.indexOf(Services.power_monitor) >= 0) {
      var options = {
        host: device_data.ip,
        port: Services.power_monitor,
        path: '/'
      };
      http.get(options, function(res) {
        res.on("data", function(body) {
          power_monitor_data = JSON.parse(body);
          updatePowerData(device_data, power_monitor_data);
        });
      }).on('error', function(e) {
        console.log("HTTP error: " + e.message);
      });
    }
    else {
      updatePowerData(device_data, null);
    }
  });

  function updatePowerData(device_data, power_monitor_data) {
    // Find power profile
    power_profile = power_profiles[device_data.model||device_data.type];
    if (power_monitor_data || power_profile || device_data.manual_power) {
      storage = (power_monitor_data ? power_monitor_data['battery']['current_energy'] : null) || 
                parseFloat(device_data.manual_storage) || 
                (power_profile ? power_profile.storage : null) || 
                0;
      power = parseFloat(device_data.manual_power) || 
              (power_profile ? power_profile.power : null) || 
              0;
      // See if this is a newly-turned-on device or not.
      just_on = true;
      if (device_data.power || device_data.storage) {
        power_total -= (device_data.power || 0);
        storage_total -= (device_data.storage || 0);
        just_on = false;
      }
      console.log('adding power for ' + mac);
      power_total += power;
      storage_total += storage;
      db.hmset('power_state', 'power', power_total, 'storage', storage_total);
      db.hmset(mac, 'power', power, 'storage', storage); 
      if (just_on)
        self.emit('device_on', mac);
      else
        self.emit('device_updated', mac);
      // If we've got a power service at the other end, poll it again in a few seconds' time
      if (power_monitor_data) {
        setTimeout(function() {
          console.log('updating power for '+mac)
          self.device_on(mac);
        }, 5000);
      }
    }
    else {
      //console.log ('no power profile found for ' + device_data.model||device_data.type)
    }
  }
}

PowerProfiler.prototype.device_off = function(mac) {
  var self = this;

  // Get data from redis
  db.hgetall(mac, function(err, device_data) {
    console.log('subtracting power for ' + mac);
    power_total -= (device_data.power || 0);
    storage_total -= (device_data.storage || 0);
    db.hmset('power_state', 'power', power_total, 'storage', storage_total);
    db.hdel(mac, 'power');
    db.hdel(mac, 'storage');
    self.emit('device_off', mac);
  });
}

module.exports = PowerProfiler;
