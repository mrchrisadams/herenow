// add prequisites first
sys = require('sys');
spawn = require('child_process').spawn;

// then spawn our tcp dump
tcpdump = spawn('sudo', ['tcpdump', '-e', '-i', 'en1']);


var exitStatus = 0;
var response = "";
var responseCount = 0;
var errCount = 0
var gotStdoutEOF = false;

tcpdump.stdout.setEncoding('utf8');

// first provide out put for 'good' output

tcpdump.stdout.addListener('data', function(chunk){
  responseCount += 1;
  sys.puts("=========================================");
    sys.puts("==============" + responseCount + "")
  sys.puts("\n");
  sys.puts("stdout: " + chunk);
  sys.puts("\n");
  sys.puts("=========================================");
  response["stdout-" +responseCount] = chunk;
});

tcpdump.stdout.addListener('end', function(chunk){
    tpcdumplog = fs.openSync('tcddump.dump', 'w+');
    fs.writeSync(tpcdumplog,response);
    fs.closeSync('tpcdumplog');
    gotStdoutEOF = true;
});

// then bad output:


tcpdump.stderr.addListener('data', function(chunk){
  errCount += 1;
  sys.puts("stderr: " + chunk);
  response["sterr-" +errCount] = chunk;
});

tcpdump.stderr.addListener('data', function(chunk){
  sys.puts("stderr: " + chunk);
  gotstderrEOF = true;
});
