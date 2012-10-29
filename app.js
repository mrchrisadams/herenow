
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , herenow = require('./herenow/herenow')
  , passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy


// Set up express server
var app = express();
app.configure(function(){
  app.use(express.static(__dirname + '/public'))
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.logger());
  app.use(app.router);
});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the TwitterStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and Twitter profile), and
//   invoke a callback with a user object.
passport.use(new TwitterStrategy({
    consumerKey: app.settings.env.CONSUMER_KEY,
    consumerSecret: app.settings.env.CONSUMER_SECRET  
    callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    console.log(profile);
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Twitter profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Twitter account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));




app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/devices/:mac', routes.device);
app.post('/devices/:mac', function(req, res){
  routes.update_device(req, res);
  app.emit('device_updated', req.params['mac'])
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });



// Start web listener

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", 3000, app.settings.env);
});

// Start network monitor

var Monitor = require('./lib/monitor.js');
var monitor = new Monitor();
monitor.start();

// Start mDNS browser
var MDNSBrowser = require('./lib/mdns_browser.js');
var mdns_browser = new MDNSBrowser();
mdns_browser.start();

// Wire monitor events to device identification

var PortScanner = require('./lib/port_scanner.js');
var port_scanner = new PortScanner();

var DeviceIdentifier = require('./lib/device_identifier.js');
var device_identifier = new DeviceIdentifier();

var UserRegister = require('./lib/user_register.js');
var user_register = new UserRegister();
user_register.start();

monitor.on('connected', function (mac) {
  console.log("Monitor: New device detected: " + mac);
  device_identifier.attempt_identification(mac);
  port_scanner.scan(mac);
  user_register.checkin(mac);
});

monitor.on('reconnected', function (mac) {
  console.log("Monitor: Known device detected: " + mac);
  device_identifier.attempt_identification(mac);
  port_scanner.scan(mac);
  user_register.checkin(mac);
});

monitor.on('disconnected', function (mac) {
  console.log("Monitor: Device disconnected: " + mac);
  user_register.checkout(mac);
});

port_scanner.on('complete', function (mac) {
  device_identifier.attempt_identification(mac);
});

mdns_browser.on('updated', function (mac) {
  console.log("MDNSBrowser: mDNS services updated: " + mac);
  device_identifier.attempt_identification(mac);
});


app.on('device_updated', function (mac) {
  console.log("DeviceIdentifier: Device updated: " + mac);
});