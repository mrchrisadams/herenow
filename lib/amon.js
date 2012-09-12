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
    device = {
      'entityId' : entity_uuid,
      'description': device_data.model,
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
        },
      ],
    }
    url =  base_url + 'entities/' + entity_uuid + '/devices';
    rest.postJson(url, device, {headers: {'Accept':'application/json'}}).on('complete', function(data, response) {
      path = data['location'].split('/');
      db.hset(mac, 'amon_device_uuid', path[path.length-1]);
    });
  });  
}

module.exports = Amon;
