require('../setup')

var should = require('should')
var assert = require('better-assert');
var db = require('../../lib/db')
var Device = require('../../herenow/db/device')

describe('Device', function(){
  describe('#findByMac', function(done){

    beforeEach(function(done){
      db.hmset("00:1e:c2:a4:d3:5e", {
        mac: "00:1e:c2:a4:d3:5e",
        type: "phone",
        owner: "mrchrisadams"
    }, done)
  })
  
  it('should fetch a device given a mac address', function(done){
    var device = new Device();

    device.findByMac("00:1e:c2:a4:d3:5e", function(err, res) {
      if (err) { throw err }
      res.owner.should.be.ok
      done();
    })
  })
})
})