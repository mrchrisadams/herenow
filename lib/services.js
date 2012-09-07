/*jslint  browser:  true,
            newcap:   true,
            nomen:    false,
            plusplus: false,
            undef:    true,
            vars:     false,
            indent:   2,
            sloppy:   true,
            white:    false */

// Ports used for scan
// Names are mDNS services, ports are used for nmap scans
var Services = {
  snmp         :   161, // SNMP
  ipp          :   631, // Internet Printing Protocol (jetdirect)
  airport      :  5009, // Airport base station configuration protocol
  heatmiser    :  8068, // Thermostat control
  apple_mobdev : 62078, // iTunes wifi sync
}

module.exports = Services;