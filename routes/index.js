
/*
 * GET home page.
 */

var gravatar = require('gravatar')

exports.index = function(req, res){
  res.render('index', { 
    title: 'Express', 
    location: "ShoreditchWorks",
    gravatar: gravatar
  })
};