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
var arp  = spawn('arp', [ '-na']);
var redis = require("redis");
var client = redis.createClient();

line_wise_arp     = carrier.carry(arp.stdout);

line_wise_arp.on('line', function (line) {
  // ? (192.168.1.1) at 0:26:b6:1e:61:5c on en1 ifscope [ethernet]
  console.log('stdout: ' + line);
  
});

// arp.stderr.on('data', function (data) {
//   console.log('stderr: ' + data);
// });

arp.on('exit', function (code) {
  console.log('child process exited with code ' + code);
});
