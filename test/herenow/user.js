require('../setup')

var should = require('should')
var assert = require('better-assert');
var db = require('../../lib/db')
var User = require('../../herenow/db/user')

describe('User', function() {
  describe('#findByDevice', function() {

    beforeEach(function(done) {
      db.hmset("mrchrisadams", {
        name: "Chris Adams",
        username: "mrchrisadams",
        devices: ["00:1e:c2:a4:d3:5e"],
        email_address: "wave@chrisadams.me.uk"
      }, done);
      console.log('done setting up…')
    })

    it('should do fetch the user for that mac', function(done) {
      var user = new User();
      user.findByDevice('00:1e:c2:a4:d3:5e', function(err, res) {
        if (err) {
          console.log(err)
        } else {
          // console.log(res)
          res.username.should.be.ok
          res.username.should.equal('mrchrisadams')
          done()
        }
      }); // find by device
    }) // should do something useful
  }) // findByDevice

})
