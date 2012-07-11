var fs = require('fs')
// fs.readFile('sample.nmap.output.txt', function (err, data) {
//   if (err) throw err;
//   console.log(data.toString());
// });


f = fs.ReadStream('sample.nmap.output.txt');

f.on('data', function(d) {
  console.log(d.toString());
});