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

function DeviceIdentifier() {
  if(false === (this instanceof DeviceIdentifier)) {
    return new DeviceIdentifier();
  }
  events.EventEmitter.call(this);
}
sys.inherits(DeviceIdentifier, events.EventEmitter);

DeviceIdentifier.prototype.identify = function(mac) {
  var self = this;

  // Noddy MAC address hash for now
  var device_info = 
  { 
    "0:14:bf" : {'name': "Linksys WRT54G", 'type': 'networking'},
    "0:1c:c3" : {'name': "Pace Sky HD+", 'type': 'set_top_box'},
    "0:1e:c0" : {'name': "Heatmiser Wifi Thermostat", 'type': 'misc'},
    "0:25:0"  : {'name': "Mac Mini", 'type': 'computer'},
    "0:90:a9" : {'name': "WD MyBook World", 'type': 'computer'},
    "18:87:96": {'name': "HTC one", 'type': 'phone'},
    "38:e7:d8": {'name': "HTC desire", 'type': 'phone'},
    "58:55:ca": {'name': "iPhone", 'type': 'phone'},
    "58:b0:35": {'name': "Macbook Pro", 'type': 'laptop'},
    "60:fa:cd": {'name': "iPhone 4S", 'type': 'phone'},
    "64:b9:e8": {'name': "iPhone", 'type': 'phone'},
    "7c:c5:37": {'name': "iPhone", 'type': 'phone'},
    "7c:ed:8d": {'name': "XBox 360", 'type': 'console'},
    "94:fe:f4": {'name': "BT Home Hub 3", 'type': 'networking'},
    "b4:99:ba": {'name': "HP PSC", 'type': 'printer'},
    "b8:27:eb": {'name': "Raspberry Pi", 'type': 'computer'},
    "d8:b3:77": {'name': "HTC sensation", 'type': 'phone'},
    "dc:d3:21": {'name': "Humax DTR-T1000", 'type': 'set_top_box'},
    "f0:b4:79": {'name': "Airport Express", 'type': 'networking'},
    "f8:1e:df": {'name': "iPhone", 'type': 'phone'},
  };

  // Store metadata in redis
  vendor_mac = mac.split(":",3).join(':');
  if (device_info[vendor_mac]) {
    db.hmset(mac, 'name', device_info[vendor_mac]['name'], 'type', device_info[vendor_mac]['type']);
  }
}

module.exports = DeviceIdentifier;
