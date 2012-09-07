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
    Services = require ('./services');

var db = require('./db')

function PortScanner() {
  if(false === (this instanceof PortScanner)) {
    return new PortScanner();
  }
  events.EventEmitter.call(this);
}
sys.inherits(PortScanner, events.EventEmitter);

PortScanner.prototype.scan = function(mac) {
  var self = this;
  var spawn = require('child_process').spawn;
  var carrier = require('carrier');

  // Get device details
  db.hgetall(mac, function(err, device) {
            
    console.log('port scanning ' + device.mac);
    service_list = [];
    for (i in Services) { service_list.push(Services[i]); }
    var nmap  = spawn('nmap', [ '-sT', '-Pn', '-p', service_list.join(','), device.ip ]);
    var found_services = [];

    line_wise_stdout  = carrier.carry(nmap.stdout);

    line_wise_stdout.on('line', function (line) {
      var re = /([0-9]{1,5}).*(open)/;
      arr = re.exec(line);
      if (arr !== null) {
        found_services.push(arr[1]);
      }
    });

    nmap.on('exit', function (code) {
      db.hset(device.mac, 'services', found_services.join());
      self.emit('complete', device.mac);
    });
    
  });

}

module.exports = PortScanner;