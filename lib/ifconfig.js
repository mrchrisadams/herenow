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
sys.inherits(IfConfig, events.EventEmitter);

IfConfig.prototype.find_ip = function(interface_name) {
  var self = this;
  var spawn = require('child_process').spawn;
  var carrier = require('carrier');

  var ifconfig  = spawn("ifconfig", [interface_name]);
  local_ip = null;

  line_wise_stdout  = carrier.carry(ifconfig.stdout);

  line_wise_stdout.on('line', function (line) {
    match = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.255)/i.exec(line)
    if (match != null) self.emit('complete', match[0]);
  });
}

module.exports = IfConfig;