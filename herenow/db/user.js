// Example User attributes
// {
//   name: "Chris Adams"
//   username: "mrchrisadams"
//   devices: [e14219423he, 32u84932u4023i, 32e23r2890r]
//   email_address: wave@chrisadams.me.uk
//   gravatar: url at a given size
//   status: offline|online
// }


exports.User = function() {
  
  
  findByDevice: function(device) {
    
    // look in redis for mac address, using hget with the device's mac as the key
    // then return the user hash, after updating status
  }
  
}
