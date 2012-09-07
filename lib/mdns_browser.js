/*jslint  browser:  true,
            newcap:   true,
            nomen:    false,
            plusplus: false,
            undef:    true,
            vars:     false,
            indent:   2,
            sloppy:   true,
            white:    false */

var sys = require('util'),
    events = require('events'),
    mdns = require('mdns'),
    Services = require('./services.js');

var db = require('./db')

function MDNSBrowser() {
  if(false === (this instanceof MDNSBrowser)) {
    return new MDNSBrowser();
  }
  events.EventEmitter.call(this);
}
sys.inherits(MDNSBrowser, events.EventEmitter);

MDNSBrowser.prototype.start = function() {
  
  // Service up handler
  // This is currently fairly restricted - it will work for iPhones and that's about it.
  // Finding the MAC address is the hard part, it's distinctly non-standard across devices,
  // as is the difference in name, host, etc.
  // Still, it works after a fashion and helps to identify some devices by name.
  function on_service_up(service) {
    mac_regexp = /([0-9a-f]{1,2}:[0-9a-f]{1,2}:[0-9a-f]{1,2}:[0-9a-f]{1,2}:[0-9a-f]{1,2}:[0-9a-f]{1,2})/
    // trawl service name for a mac address
    arr = mac_regexp.exec(service.name);
    if (arr !== null){
      mac_addr = arr[1];
      // Store details
      db.hset(mac_addr, 'name', service.host.split('.')[0]);
    }
  }
  
  // Browse each service individually
  for (service_name in Services) {
    // Service names in list have underscores instead of hyphens    
    var browser = mdns.createBrowser(mdns.tcp(service_name.replace('_','-')));
    browser.on('serviceUp', on_service_up);
    browser.start();    
  }
    
}

module.exports = MDNSBrowser;
