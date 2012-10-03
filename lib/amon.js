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

function Amon() {
  if(false === (this instanceof Amon)) {
    return new Amon();
  }
  events.EventEmitter.call(this);
}
sys.inherits(Amon, events.EventEmitter);

Amon.prototype.add_device = function(mac) {
  // Get data from redis
  db.hgetall(mac, function(err, device_data){
    // See if we already have a device UUID
    if (device_data.amon_device_uuid)
      return;
    // Add AMON device
    data = {
      'entityId' : entity_uuid,
      'description': device_data.model || device_data.mac,
      'location' : {
        'name': device_data.mac
      },
      'privacy': 'private',
      "readings": [
        {
          "type": "electricityConsumption",
          "unit": "W",
          "period": "INSTANT"
        },
        {
          "type": "electricityStorage",
          "unit": "Wh",
          "period": "INSTANT"
        },
        {
          "type": "powerStatus",
          "period": "INSTANT"
        },
      ],
    }
    url =  base_url + 'entities/' + entity_uuid + '/devices';
    rest.json(url, data, {headers: {'Accept':'application/json'}}, 'POST').on('complete', function(response_data, response) {
      path = response_data['location'].split('/');
      db.hset(mac, 'amon_device_uuid', path[path.length-1]);
    });
  });  
}

Amon.prototype.update_device = function(mac) {
  // Get data from redis
  db.hgetall(mac, function(err, device_data){
    // If we already have a device UUID
    if (!device_data.amon_device_uuid)
      return;
    // Update AMON device
    data = {
      'entityId' : entity_uuid,
      'deviceId' : device_data.amon_device_uuid,
      'description': device_data.model || device_data.mac,
      'location' : {
        'name': device_data.mac
      },
      'privacy': 'private',
      "readings": [
        {
          "type": "electricityConsumption",
          "unit": "W",
          "period": "INSTANT"
        },
        {
          "type": "electricityStorage",
          "unit": "Wh",
          "period": "INSTANT"
        },
        {
          "type": "powerStatus",
          "period": "INSTANT"
        },
      ],
    }

    url =  base_url + 'entities/' + entity_uuid + '/devices/' + device_data.amon_device_uuid;
    rest.json(url, data, {headers: {'Accept':'application/json'}}, 'PUT');
  });  
}

Amon.prototype.device_on = function(mac) {
  // Get data from redis
  db.hgetall(mac, function(err, device_data){
    // If we already have a device UUID
    if (!device_data.amon_device_uuid)
      return;
    // Add readings
    time = (new Date()).toISOString();
    data = {
      'measurements' : [
        {
          "type": "electricityConsumption",
          "timestamp": time,
          "value": parseFloat(device_data.power),        
        },
        {
          "type": "electricityStorage",
          "timestamp": time,
          "value": parseFloat(device_data.storage),
        },
        {
          "type": "powerStatus",
          "timestamp": time,
          "value": 1,
        },
      ],
    }
    url =  base_url + 'entities/' + entity_uuid + '/devices/' + device_data.amon_device_uuid + '/measurements';
    rest.json(url, data, {headers: {'Accept':'application/json'}}, 'POST');
  });  
}


Amon.prototype.device_off = function(mac) {
  // Get data from redis
  db.hgetall(mac, function(err, device_data){
    // If we already have a device UUID
    if (!device_data.amon_device_uuid)
      return;
    // Add readings
    time = (new Date()).toISOString();
    data = {
      'measurements' : [
        {
          "type": "electricityConsumption",
          "timestamp": time,
          "value": 0,
        },
        {
          "type": "electricityStorage",
          "timestamp": time,
          "value": 0,
        },
        {
          "type": "powerStatus",
          "timestamp": time,
          "value": 0,
        },
      ],
    }
    url =  base_url + 'entities/' + entity_uuid + '/devices/' + device_data.amon_device_uuid + '/measurements';
    rest.json(url, data, {headers: {'Accept':'application/json'}}, 'POST');
  });  
}

module.exports = Amon;
