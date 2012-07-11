var request = require('request');

process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

// console.log("\n\n\n");
// 
var payload = process.argv[2]
// 
// console.log("\n\n\n");
// 
console.log(payload);
// 

JSON

// console.log("\n\n\n");



// parse out the arg0

// serialise
// 
var request = require('request');
request({
  url: 'http://argonauts.3aims.com',
  method: "POST",
  body: payload

}
  
  , function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body) // Print the google web page.
  }
})