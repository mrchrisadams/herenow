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

function IfConfig() {
  if(false === (this instanceof IfConfig)) {
    return new IfConfig();
  }
  events.EventEmitter.call(this);
}
sys.inherits(IfConfig, events.EventEmitter);

IfConfig.prototype.toString = function() {
  return "IfConfig"
}

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