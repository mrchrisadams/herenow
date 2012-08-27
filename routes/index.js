
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
    ]
  })
};