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
    rest = require('restler');
;

// Load configuration
eval(fs.readFileSync('config/amon.js', encoding="ascii"));

var db = require('./db')

var base_url = 'https://' + amon_config.username + ':' + amon_config.password + '@' + amon_config.server + '/3/';
var entity_uuid = amon_config.entity_uuid;

function AmonUSB() {
  if(false === (this instanceof AmonUSB)) {
    return new AmonUSB();
  }
  events.EventEmitter.call(this);
}
sys.inherits(AmonUSB, events.EventEmitter);

AmonUSB.prototype.add_or_update_device = function(mac, usb_id, callback) {
  // Get data from redis
  db.hgetall(usb_id, function(err, usb_data){
    // AMON device data
    data = {
      'entityId' : entity_uuid,
      'description': usb_data.name,
      'location' : {
        'name': mac
      },
      'privacy': 'private',
      "readings": [
        {
          "type": "electricityConsumption",
          "unit": "mW",
          "period": "INSTANT"
        },
        {
          "type": "connectionStatus",
          "period": "INSTANT"
        },
      ],
    }
    url =  base_url + 'entities/' + entity_uuid + '/devices';
    // See if we already have a device UUID
    if (usb_data.amon_device_uuid) {
      // Update AMON device
      url =  base_url + 'entities/' + entity_uuid + '/devices/' + usb_data.amon_device_uuid;
      rest.json(url, data, {headers: {'Accept':'application/json'}}, 'PUT');
    }
    else {
      // Create AMON device
      rest.json(url, data, {headers: {'Accept':'application/json'}}, 'POST').on('complete', function(response_data, response) {
        path = response_data['location'].split('/');
        db.hset(usb_id, 'amon_device_uuid', path[path.length-1]);
      });      
    }
  });
  if (callback)
    callback(); 
}

AmonUSB.prototype.add_measurement = function(uuid, power, connectionStatus) {
  // If we already have a device UUID
  if (!uuid)
    return;
  // Add readings
  time = (new Date()).toISOString();
  data = {
    'measurements' : [
      {
        "type": "electricityConsumption",
        "timestamp": time,
        "value": parseFloat(power),
      },
      {
        "type": "connectionStatus",
        "timestamp": time,
        "value": connectionStatus,
      },
    ],
  }
  url =  base_url + 'entities/' + entity_uuid + '/devices/' + uuid + '/measurements';
  rest.json(url, data, {headers: {'Accept':'application/json'}}, 'POST');      
}

AmonUSB.prototype.device_on = function(mac, usb_id) {
  var self=this;
  // Make sure there is a device first
  self.add_or_update_device(mac, usb_id, function() {
    // Get data from redis
    db.hgetall(usb_id, function(err, usb_data){
      self.add_measurement(usb_data.amon_device_uuid, usb_data.power, 1);
    });  
  });
}


AmonUSB.prototype.device_off = function(mac, usb_id) {
  var self=this;
  // Get data from redis
  db.hgetall(usb_id, function(err, usb_data){
    self.add_measurement(usb_data.amon_device_uuid, 0, 0);
  });
}

module.exports = AmonUSB;
