// give us some bdd syntax
require('should')

var express = require('express')
  , routes = require('../routes')
  , herenow = require('../herenow/herenow');


// Set up express server
var app = express();
app.configure(function(){
  app.use(express.static(__dirname + '/public'))
  app.set('view engine', 'jade');

  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.logger());
  app.use(app.router);
});

  
// // Set up express server
// var app = module.exports = express.createServer();
// app.configure(function(){
//   app.set('views', __dirname + '/views');
//   app.set('view engine', 'jade');
//   app.use(express.bodyParser());
//   app.use(express.methodOverride());
//   app.use(app.router);
//   app.use(express.static(__dirname + '/public'));
// });

app.get('/', routes.index);
app.get('/devices/:mac', routes.device);
app.post('/devices/:mac', function(req, res){
  routes.update_device(req, res);
  app.emit('device_updated', req.params['mac'])
});


app.configure('test', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
