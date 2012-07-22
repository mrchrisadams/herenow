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
  // at this point, we should trigger the arp, as its tables will be full again
});