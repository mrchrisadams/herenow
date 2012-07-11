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
var nmap  = spawn('nmap', [ '-sP', '192.168.0.9/24', '-oG', '/dev/null' ]);
var carrier = require('carrier');


var ls    = spawn('ls', ['-lh', '.']);


nmap.stdout.setEncoding('utf8');

line_wise_stdout = carrier.carry(nmap.stdout)
line_wise_stdout.on('line', function (line) {
  console.log('stdout: ' + line);
});

nmap.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

nmap.on('exit', function (code) {
  console.log('child process exited with code ' + code);
});


// 
// 
// ls.stdout.on('data', function (data) {
//   console.log('stdout: ' + data);
// });
// 
// ls.stderr.on('data', function (data) {
//   console.log('stderr: ' + data);
// });
// 
// ls.on('exit', function (code) {
//   console.log('child process exited with code ' + code);
// });