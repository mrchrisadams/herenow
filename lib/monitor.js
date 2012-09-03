/*jslint  browser:  true,
            newcap:   true,
            nomen:    false,
            plusplus: false,
            undef:    true,
            vars:     false,
            indent:   2,
            sloppy:   true,
            white:    false */

var IfConfig = require('./ifconfig.js')
var ifconfig = new IfConfig();

var Nmap = require('./nmap.js')
var nmap = new Nmap();

var interface_name = 'en0';

ifconfig.on('complete', function (ip) {
  console.log('local ip: ' + ip);
  nmap.scan(ip);
});

nmap.on('complete', function (ip) {
  console.log('nmap scan complete');
  ifconfig.find_ip(interface_name);
});

ifconfig.find_ip(interface_name);