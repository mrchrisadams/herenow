// add prequisites first
sys = require('sys');
fs = require('fs');

sys.puts(require.paths);

spawn = require('child_process').spawn;

// then spawn our tcp dump
tcpdump = spawn('sudo', ['tcpdump', '-e', '-i', 'eth2']);


var exitStatus = 0;
var response = "";
var responseCount = 0;
var errCount = 0
var gotStdoutEOF = false;

tcpdump.stdout.setEncoding('utf8');

// first provide out put for 'good' output

tcpdump.stdout.addListener('data', function(chunk){
  responseCount += 1;
  sys.puts('.');
  lines = chunk.split('\n');

  for (var i=0, lines; line = lines[i]; i++){
    // create absurd regexp to match against for each line
    var mac_address_pattern = /.*([0-9]{2}:[0-9a-z]{2}:[0-9a-z]{2}:[0-9a-z]{2}:[0-9a-z]{2}:[0-9a-z]{2})/;
    var mac = line.match(mac_address_pattern)
    if (mac) {
      sys.puts("[" + i + '] - mac is ' + mac[1]);  
    }
    
  }
// 
});
// TODO - add callback for when we kill this. 
// It may simplty be that this needs to be the global process instead of the child process to get our text dump.

//tcpdump.stdout.addListener('end', function(chunk){
//    tpcdumplog = fs.openSync('tcddump.dump', 'w+');
//    fs.writeSync(tpcdumplog, response);
//    fs.closeSync('tpcdumplog');
//    gotStdoutEOF = true;
//});

// we now list error output too
tcpdump.stderr.addListener('data', function(chunk){
  errCount += 1;
  sys.puts("stderr: " + chunk);
  response["sterr-" +errCount] = chunk;
});

tcpdump.stderr.addListener('end', function(chunk){
  sys.puts("stderr: " + chunk);
  gotstderrEOF = true;
});


