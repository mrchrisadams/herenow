/*jslint  browser:  true,
            newcap:   true,
            nomen:    false,
            plusplus: false,
            undef:    true,
            vars:     false,
            indent:   2,
            sloppy:   true,
            white:    false */


var util  = require('util');
var spawn = require('child_process').spawn;
var carrier = require('carrier');

var nmap  = spawn('nmap', [ '-sP', '192.168.0.9/24', '-oG', '/dev/null' ]);
var arp  = spawn('arp', [ '-na']);

line_wise_stdout  = carrier.carry(nmap.stdout);
line_wise_arp     = carrier.carry(arp.stdout);

line_wise_arp.on('line', function (line) {
  console.log('stdout: ' + line);
});

arp.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

arp.on('exit', function (code) {
  console.log('child process exited with code ' + code);
});


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
});
