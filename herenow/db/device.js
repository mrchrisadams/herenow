// Example Device attributes
// {
//     mac: 00:1e:c2:a4:d3:5e # this doesn't change, but shouldn't be exposed, hence the guid
//     ip: 192.145.6.4 # this will change
//     first_appeared: # timestamp, no reason not to use unix 
//     owner: user id # as in 'belongs to', or '0' or '-1' if the generic "robot device" catch all
//     guid: RFC generated
//     status: online, offline, 
//   }
//   
// };

var findByMac = function(mac) {
  // look in redis for mac address, using hget with the device's mac as the key
  // then return the device object after updating status, and ip requesting address
}

exports.findByMac = findByMac
  
  
