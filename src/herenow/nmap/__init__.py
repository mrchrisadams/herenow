import datetime
import subprocess
from commandtool import Cmd
from pipestack.ensure import ensure_method_bag
from bn import AttributeDict

class NmapCmd(Cmd):
    arg_spec = [
        ('SUBNET', 'The subnet to scan in the form 192.168.0.1/24'),
    ]
    option_spec = {
        'help': dict(
            options = ['-h', '--help'],
            help = 'show the help messages',
        ),
        'ignore': dict(
            options = ['-i', '--ignore'],
            help = 'a comma separated list (no spaces) of hosts/networks to ignore',
            metavar='IGNORE',
        ),
        'wipe': dict(
            options = ['--wipe'],
            help = 'ignore all other options and permenantly wipe the person database',
        ),
        'expire': dict(
            options = ['-e', '--expire'],
            help = 'the number of seconds after which a mac add address is considered to have left the network, defaults to 120s',
            metavar='EXPIRE',
        ),
    }
    help = dict(
        summary = 'Run an Nmap daemon',
    )

    def on_run(self, app, args, opts):
        app.start_flow(
            AttributeDict(
                nmap=AttributeDict(
                    ignore=opts.get('ignore'), 
                    subnet=args[0],
                    expire=int(opts.get('expire', 120)),
                    wipe=opts.wipe,
                )
            ), 
            run=self.run,
        )

    @ensure_method_bag('database')
    def run(self, bag):
        if bag.nmap.wipe:
            print "Wiping the person table..."
            bag.database.query(
                '''
                DROP TABLE IF EXISTS person;
                ''',
                fetch = False,
            )
            print "Creating the person table..."
            bag.database.query(
                '''
                CREATE TABLE person (
                    mac_address TEXT NOT NULL
                  , ip TEXT NOT NULL
                  , expire TEXT NOT NULL
                  , name TEXT
                  , email TEXT
                  , status TEXT
                )
                ''',
                fetch = False,
            )
        cmd = ["nmap", "-sP", bag.nmap.subnet]
        if bag.nmap.ignore:
            cmd.append('--exclude')
            cmd.append(bag.nmap.ignore)
        print cmd
        process = subprocess.Popen(
            cmd,
            shell=False, 
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
        cmd = ["cat", "/proc/net/arp"]
        print cmd
        process = subprocess.Popen(
            cmd,
            shell=False, 
            stdout=subprocess.PIPE
        )
        stdout, stderr = process.communicate()
        process.wait()
        macs = {}
        # Output from cat /proc/net/arp looks like this:
        # 172.31.24.153    0x1         0x2         00:0e:8e:25:04:ae     *        eth2
        # The code below parses them. This only works on Linux (with a /proc
        # filesystem), on other platforms we'll have to run ``arp`` and parse
        # data differently.
        for line in stdout.split('\n'):
            if '0x2' in line:
                cols = []
                parts = line.split(' ')
                for part in parts:
                    if part.strip():
                        cols.append(part.strip())
                macs[cols[0]] = cols[3]
        print macs
        ips_ = dict([(v,k) for k,v in macs.items()])
        # Remove the old ones
        for person in bag.database.query('select * from person'):
            if datetime.datetime.strptime(person['expire'][:16], '%Y-%m-%d %H:%M') < datetime.datetime.now() \
               or person['mac_address'] not in macs.values():
                print "Removing mac %s"%person['mac_address']
                bag.database.query('delete from person where mac_address = ?', (person['mac_address'],), fetch=False)
        # Now store them in the database
        for mac in macs.values():
            if not bag.database.query('select * from person where mac_address = ?', (mac,)):
                print "Adding new mac %s"%mac
                bag.database.insert_record(
                    'person',
                    {
                        'mac_address': mac, 
                        'ip': ips_[mac], 
                        'expire': (datetime.datetime.now()+datetime.timedelta(seconds=bag.nmap.expire)).strftime('%Y-%m-%d %H:%M')
                    }
                )
            else:
                person = bag.database.query(
                    'update person set expire = ? where mac_address = ?',
                    (
                         (datetime.datetime.now()+datetime.timedelta(seconds=bag.nmap.expire)).strftime('%Y-%m-%d %H:%M:%s'),
                         mac, 
                    )
                )
 

