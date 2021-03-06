// Wrapper for Nmap

// Events this object emits: 
// `complete` - triggered when the call to the binary has completed


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

Nmap.prototype.toString = function() {
  return "Nmap"
}

// Wraps the initial call to `nmap`. 

 // `local_ip` - the String representing an ip address like `192.168.0.3`

Nmap.prototype.scan = function(local_ip) {
  var self = this;
  var spawn = require('child_process').spawn;
  var carrier = require('carrier');

  console.log(self.toString() + ': starting nmap');
  var nmap  = spawn('nmap', [ '-sn', local_ip+'/24', '-oG', '/dev/null' ]);

  line_wise_stdout  = carrier.carry(nmap.stdout);

  nmap.on('exit', function (code) {
    console.log(self.toString() + ': nmap completed with code ' + code);
    self.emit('complete');
  });

}

module.exports = Nmap;