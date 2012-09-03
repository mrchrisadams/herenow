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

interface_name = 'en0';

var ifconfig  = spawn("ifconfig", [interface_name]);
local_ip = null;

line_wise_stdout  = carrier.carry(ifconfig.stdout);

line_wise_stdout.on('line', function (line) {
  match = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.255)/i.exec(line)
  if (match != null)   {
    local_ip = match[0];
  }
});

ifconfig.on('exit', function (code) {
  if (local_ip) run_nmap(local_ip);
});

function run_nmap(ip) {
  
  var nmap  = spawn('nmap', [ '-sn', ip+'/24', '-oG', '/dev/null' ]);

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

}