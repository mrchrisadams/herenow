// This ifConfig object calls `ifconfig` and emits a couple of events, `device_updated`, and `local_ip_found`.
// 
// It's designed to act as a handy wrapper around `ifconfig`, pull out
// the necessary ip address to pass into any calls to `nmap`, or any other
// tool that can tell the app more about any new entrant onto the network


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

function IfConfig() {
  if(false === (this instanceof IfConfig)) {
    return new IfConfig();
  }
  events.EventEmitter.call(this);
}
// Mixin our `eventEmitter` ablities into the object, and give a more
// helpful string to return so we can identify
// instances of IfConfig more easily

sys.inherits(IfConfig, events.EventEmitter);

IfConfig.prototype.toString = function() {
  return "IfConfig"
}

// Make the call to `ifconfig`. Most of the action happens here
// pass in an interface_name like `en1` or `en0`
IfConfig.prototype.probe_localhost = function(interface_name) {
  var self = this;
  var spawn = require('child_process').spawn;
  var carrier = require('carrier');

  var ifconfig  = spawn("ifconfig", [interface_name]);
  var local_ip = null;
  var local_mac = null;

  line_wise_stdout  = carrier.carry(ifconfig.stdout);

  line_wise_stdout.on('line', function (line) {
    // Look for IP
    ip = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}).*\d{1,3}\.\d{1,3}\.\d{1,3}\.255/i.exec(line)
    if (ip != null) local_ip = ip[1];
    // Look for mac addr
    mac = /([A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2})/i.exec(line)
    if (mac != null) local_mac = mac[0];
  });

  // The payoff emitting these here lets other objects use the mac and app
  // to trigger further scanning shenanigans and japery
  ifconfig.on('exit', function (code) {
    setTimeout(function() {
      if (local_ip && local_mac) {
        self.emit('device_updated', local_mac, local_ip);
      }
      if (local_ip) self.emit('local_ip_found', local_ip, local_mac);
    }, 100);
  });

}

module.exports = IfConfig;