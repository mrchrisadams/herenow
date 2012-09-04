
/*
 * GET home page.
 */

var gravatar = require('gravatar')

exports.index = function(req, res){
  allDevices = [
    { ip: "192.168.1.8", mac : "00:1a:a2:a6:d7:2c", name: "HP Printer", type: 'printer' },
    { ip: "192.168.1.8", mac : "00:1a:a2:a1:a3:3a", name: "Netgear Router", type: 'router' },
    { ip: "192.168.1.5", mac : "00:1e:c2:a4:d7:2e", name: "Chris' iPhone", type: 'phone', user: "mrchrisadams" },
    { ip: "192.168.1.6", mac : "00:1a:a2:e4:d3:1a", user: "mrchrisadams", type: 'laptop' },
    { ip: "192.168.1.7", mac : "00:1a:a6:a6:d7:2d" },
  ];
  
  res.render('index', { 
    title: 'HereNow', 
    location: "ShoreditchWorks",
    gravatar: gravatar,
    
    // Some users
    users : [ 
      { email: "wave@chrisadams.me.uk", username: "mrchrisadams" }, 
      { email: "james@floppy.org.uk", username: "floppy" }
    ],
    
    // split into owned and ownerless devices
    ownedDevices : allDevices.filter(function hasOwner(element, index, array) {
      return (element['user'] != null);
    }),
    
    ownerlessDevices : allDevices.filter(function hasNoOwner(element, index, array) {
      return (element['user'] == null);
    })

  })
};