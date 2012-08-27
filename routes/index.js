
/*
 * GET home page.
 */

var gravatar = require('gravatar')

exports.index = function(req, res){
  res.render('index', { 
    title: 'Express', 
    location: "ShoreditchWorks",
    gravatar: gravatar,
    users : [ 
      { email: "wave@chrisadams.me.uk", username: "mrchrisadams" }, 
      { email: "null@void.com", username: "not_known_yet" }
    ],
    // add our unidentified devices
    unidentifiedDevices :[
      { ip: "192.168.1.5", mac : "00:1e:c2:a4:d7:2e" },
      { ip: "192.168.1.6", mac : "00:1a:a2:e4:d3:1a" },
      { ip: "192.168.1.7", mac : "00:1a:a6:a6:d7:2d" },
    ],

    // add our unidentified devices
    knownDevices : [
      { ip: "192.168.1.8", mac : "00:1a:a2:a6:d7:2c", name: "A printer" },
      { ip: "192.168.1.8", mac : "00:1a:a2:a1:a3:3a", name: "the router" },
    ]
    
  })
};