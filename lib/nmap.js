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

function Nmap() {
  if(false === (this instanceof Nmap)) {
    return new Nmap();
  }
  events.EventEmitter.call(this);
}
sys.inherits(Nmap, events.EventEmitter);

Nmap.prototype.scan = function(local_ip) {
  var self = this;
  var spawn = require('child_process').spawn;
  var carrier = require('carrier');

  var nmap  = spawn('nmap', [ '-sn', local_ip+'/24', '-oG', '/dev/null' ]);

  line_wise_stdout  = carrier.carry(nmap.stdout);

  line_wise_stdout.on('line', function (line) {
    // this regular expression checks for ip addresses
    // /(Host:)\s+(\d{0,3}\.\d{0,3}\.\d{0,3}\.\d{0,3})\s+(\(\))\s+(Status:.*)/
    console.log('stdout: ' + line);
  });

  nmap.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  nmap.on('exit', function (code) {
    console.log('nmap exited with code ' + code);
    self.emit('complete');
  });

}

module.exports = Nmap;