
/*
 * GET home page.
 */

var gravatar = require('gravatar')
var db = require('../lib/db')
var Amon = require ('../lib/amon');

exports.index = function(req, res){

  // Device list
  mac_addresses = []
  allDevices = []
  power_state = {}
  
  // Load mac addresses from redis
  db.smembers("all_devices", load_mac_addresses);  
  
  function load_mac_addresses(err, devices) {
    /* Store all MAC addresses */
    if (devices == null)
      mac_addresses = []
    else
      mac_addresses = devices    
    /* Load individual device data */
    get_next_device();
  }

  function load_device_data(err, data) {
    /* Store device data */
    if (data != null)
      allDevices.push(data)
    /* Get more data */
    get_next_device();
  }

  function get_next_device() {
    // Pop next mac off list
    mac = mac_addresses.pop();
    // Get device data from redis if there is more to load
    if (mac != null)
      db.hgetall(mac, load_device_data);
    // If not, render the page
    else
      db.hgetall('power_state', load_power_state);
  }
  
  function load_power_state(err, data) {
    power_state = data;
    render();
  }

  function render() {

    // Static list of users for now
    users = [ 
      { email: "wave@chrisadams.me.uk", username: "mrchrisadams", devices: allDevices.filter(function hasOwner(element, i, a) {return (element['user'] == "mrchrisadams" && element['ip'] != null); }) }, 
      { email: "james@floppy.org.uk", username: "floppy", devices: allDevices.filter(function hasOwner(element, i, a) {return (element['user'] == "floppy" && element['ip'] != null); })  }
    ];

    res.render('index', { 
      title: 'HereNow', 
      location: "ShoreditchWorks",
      gravatar: gravatar,
        
      presentUsers : users.filter(function hasDevicesPresent(element, index, array) {
        return (element['devices'].length > 0);
      }),
        
      awayUsers : users.filter(function hasNoDevicesPresent(element, index, array) {
        return (element['devices'].length == 0);
      }),

      ownerlessDevices : allDevices.filter(function hasNoOwner(element, index, array) {
        return (element['user'] == null && element['ip'] != null);
      }),

      disconnectedDevices : allDevices.filter(function hasNoOwner(element, index, array) {
        return (element['ip'] == null);
      })

    })
  }

};


exports.device = function(req, res){
  
  var usb_device_ids =[];
  var usb_devices =[];

  // Load USB devices from redis
  db.smembers('usb_'+req.params['mac'], load_usb_device_list);  
  
  function load_usb_device_list(err, devices) {
    /* Store all MAC addresses */
    if (devices == null)
      usb_device_ids = []
    else
      usb_device_ids = devices    
    /* Load individual device data */
    get_next_usb_device();
  }

  function load_usb_device_data(err, data) {
    /* Store device data */
    if (data != null)
      usb_devices.push(data)
    /* Get more data */
    get_next_usb_device();
  }

  function get_next_usb_device() {
    // Pop next mac off list
    id = usb_device_ids.pop();
    // Get device data from redis if there is more to load
    if (id != null)
      db.hgetall(id, load_usb_device_data);
    // If not, render the page
    else
      db.hgetall(req.params['mac'], render);
  }
  
  function render(err, device) {
    res.render('device', { 
      title: 'HereNow', 
      location: "ShoreditchWorks",
      device: device,
      usb_devices: usb_devices,
      amon: new Amon()
    })
  }
};

exports.update_device = function(req, res){
  db.hmset(req.params['mac'], req.body);
  res.redirect('/');
};