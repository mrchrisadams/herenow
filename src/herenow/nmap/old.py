import datetime
import subprocess
import time

from bn import AttributeDict
from serviceprovider import ensure

#
# Event handlers
#

def log(string, *k):
    print string%k

@ensure('redis')
def redis_on_reading(service, final):
    r = service.redis.connection
    people = []
    ips = []
    log('All results: %r', final)
    for ip, mac in final.items():
        mac_address = mac['mac_address']
        name = r.get('mac:'+mac_address)
        log("Found IP %r, Mac %r, Name %r", ip, mac_address, name)
        ips.append('%s-%s-%s'%(mac_address, ip, name))
        if not name:
            name = 'Unknown'
        if name not in people:
            people.append(name)
            log("Incrementing name %s by %s", name, 300)
            r.incr('name:%s:time'%name, 300)
        else:
            log("Ignoring %r, %r, %r", ip, mac_address, name)
    if not people:
        r.incr('name:Waste:time', 300)
    log("Setting 'current_people' to %r, 'current_ips' to %r",  ', '.join(people), ', '.join(ips))
    r.set('current_people', ', '.join(people))
    r.set('current_ips', ', '.join(ips))

@ensure('redis', 'database')
def database_to_redis_on_load_names(service):
    r = service.redis.connection

    for mac_address, name in service.database.query('SELECT mac_address, name from device', format='list'):
        key = 'mac:%s'%mac_address
        log("Setting %r %r", key, name)
        r.set(key, name)
        if r.get('name:%s:time'%name) is None:
            r.set('name:%s:time'%name, 0)

def on_error(service, msg):
    print 'ERROR [%s] %s'%(str(datetime.datetime.now())[:19], msg)

def on_reading(service, watts):
    print '[%s] %s watts'%(str(datetime.datetime.now())[:19], watts)

#
# Service
#

def take_reading(service):
    ignore = service.boot.option['nmap'].get('ignore', '').split(', ')
    process = subprocess.Popen(
        [
            "nmap -sP %s/24"%(service.boot.option['nmap']['ip'])
        ], 
        shell=True, 
        stdout=subprocess.PIPE
    )
    stdout, stderr = process.communicate()
    process.wait()
    ips = {}
    for line in stdout.split('\n'):
        if line.startswith('Host ') and line.endswith(' appears to be up.'):
            l = line[5:-18]
            if '(' in l and ')' in l:
                ip = l[l.find('(')+1:l.find(')')]
                ips[ip] = l[:l.find('(')-1] 
    process = subprocess.Popen(
        [
            "cat /proc/net/arp"
        ], 
        shell=True, 
        stdout=subprocess.PIPE
    )
    stdout, stderr = process.communicate()
    process.wait()
    macs = {}
    for line in stdout.split('\n'):
        if '0x2' in line:
            cols = []
            parts = line.split(' ')
            for part in parts:
                if part.strip():
                    cols.append(part.strip())
            macs[cols[0]] = cols[3]
    final = {}
    for k, v in macs.items():
        if k in ignore:
            continue
        final[k] = {'mac_address': v}
        if ips.has_key(k):
            final[k]['host'] = ips[k]
    return final

def nmapReading(on_load_names, on_reading=on_reading, on_error=on_error):

    def nmapReading_constructor(service):
        #config(service)
        # Keep hold of the name given to this service
        name = service.name
        next_run = [datetime.datetime.now()]
        started = []
        def start(service):
            if not started:
                on_load_names(service)
                started.append(True)
            if datetime.datetime.now() < next_run[0]:
                print "Waiting for 30 seconds"
                time.sleep(30)
                return
            print "Running"
            next_run[0] = next_run[0] + datetime.timedelta(seconds=300)
            try:
                final = take_reading(service)
            except Exception, e:
                on_error(service, str(e))
            else:
                on_reading(service, final)
        return AttributeDict(start=start)
    return nmapReading_constructor

