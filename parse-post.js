
var Shred = require("shred");
var shred = new Shred();
// 
var req = shred.get({
    url: "http://ask.amee.com/answer.json?q=10kg+of+beef",
  headers: {
    "Host": "ask.amee.com",
    "Connection": "keep-alive",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.142 Safari/535.19",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "gzip,deflate,sdch",
    "Accept-Language": "en-US,en;q=0.8",
    "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.3"
  },
  on: {
    // You can use response codes as events
    200: function(response) {
      // Shred will automatically JSON-decode response bodies that have a
      // JSON Content-Type
      console.log(response.content.data);
    },

    // Any other response means something's wrong
    response: function(response) {
      console.log("Oh no!");
    }
  }
});


// var req = shred.get({
//   url: "http://api.spire.io/",
//   headers: {
//     Accept: "application/json"
//   },
//   on: {
//     // You can use response codes as events
//     200: function(response) {
//       // Shred will automatically JSON-decode response bodies that have a
//       // JSON Content-Type
//       console.log(response.content.data);
//     },
//     // Any other response means something's wrong
//     response: function(response) {
//       console.log("Oh no!");
//     }
//   }
// });
