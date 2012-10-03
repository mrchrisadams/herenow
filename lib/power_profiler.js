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
      db.del('usb_'+devices[i]);
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
    if (device_data.services && device_data.services.indexOf(Services.power_monitor) >= 0) {
      var options = {
        host: device_data.ip,
        port: Services.power_monitor,
        path: '/'
      };
      http.get(options, function(res) {
        var body = "";
        res.on("data", function(chunk) {
          body += chunk;
        });
        res.on("end", function() {
          power_monitor_data = null;
          try {
            power_monitor_data = JSON.parse(body);
          } catch(err) {}
          updateUsbData(device_data, power_monitor_data);
          updatePowerData(device_data, power_monitor_data);
        });
      }).on('error', function(e) {
        console.log("HTTP error: " + e.message);
      });
      // poll again in a few seconds' time
      setTimeout(function() {
        self.device_on(mac);
      }, 5000);
    }
    else {
      updatePowerData(device_data, null);
    }
  });

  function updateUsbData(device_data, power_monitor_data) {
    db.smembers("usb_"+device_data.mac, function(err, usb_devices) {
      // Get list of previously-connected USB devices
      if (usb_devices == null)
        all_usb_devices = []
      else
        all_usb_devices = usb_devices    
      // Loop through current devices, updating data as we go
      for (i in power_monitor_data['usb']['devices']) {
        device = power_monitor_data['usb']['devices'][i];
        uid = (device['serial_number'] == '?') ? device['bus_number']+':'+device['device_address'] : device['serial_number'];
        device_identifier = "usb_"+device_data.mac+":"+device['manufacturer_id']+":"+device['product_id']+":"+uid;
        device_name = ""
        if (device['manufacturer'] != '?')
          device_name = device['manufacturer'] + ' ' + device['product']
        else
          device_name = device['device_class']['description']
        db.hmset(device_identifier, "power", device['power'], "connected", true, "name", device_name);
        db.sadd("usb_"+device_data.mac, device_identifier);
        // Remove from list of known devices so we know it's present
        var index = all_usb_devices.indexOf(device_identifier);
        if(index!=-1) {
          all_usb_devices.splice(index, 1);
        }
        else {
          // Send device connected message if new
          self.emit('usb_device_connected', device_data.mac, device_identifier);
        }
      }
      // Mark any left in the previous list as disconnected
      all_usb_devices.forEach(function(uid){
        db.hmset(device_identifier, "connected", false);
        db.srem("usb_"+device_data.mac, uid);
        self.emit('usb_device_disconnected', device_data.mac, uid);
      });
    });
  }

  function updatePowerData(device_data, power_monitor_data) {
    // Find power profile
    power_profile = power_profiles[device_data.model||device_data.type];
    if (power_monitor_data || power_profile || device_data.manual_power) {
      // Get battery power use from power daemon if available
      battery_power = power_monitor_data ? power_monitor_data['battery']['current_power'] : 0
      // Calculate storage and power stats
      storage = (power_monitor_data ? power_monitor_data['battery']['current_energy'] : null) || 
                parseFloat(device_data.manual_storage) || 
                (power_profile ? power_profile.storage : null) || 
                0;
      power = parseFloat(device_data.manual_power) || 
              (power_profile ? power_profile.power : null) || 
              0;
      // If we're off the mains, there is no draw from AC adapter so set power to 0
      if (power_monitor_data && (power_monitor_data['battery']['ac_power'] == false || battery_power < 0))
        power = 0;
      // Otherwise, include total USB device power as well
      else {
        power += (power_monitor_data ? power_monitor_data['usb']['power']/1e3 : 0)
        // Include battery power when charging (not when discharging)
        if (battery_power >= 0)
          power += battery_power;
      }
      // See if this is a newly-turned-on device or not.
      just_on = true;
      if (device_data.power || device_data.storage) {
        power_total -= (device_data.power || 0);
        storage_total -= (device_data.storage || 0);
        just_on = false;
      }
      console.log(mac + ' power = ' + power + '/' + storage);
      power_total += power;
      storage_total += storage;
      changed = (power != device_data.power || storage != device_data.storage)
      db.hmset('power_state', 'power', power_total, 'storage', storage_total);
      db.hmset(mac, 'power', power, 'storage', storage); 
      if (just_on)
        self.emit('device_on', mac);
      else if (changed)
        self.emit('device_updated', mac);
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
