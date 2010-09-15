from pipestack.ensure import ensure_function_marble
import urllib, hashlib

def grav_image(mac, size=200):
    gravatar_url = "http://www.gravatar.com/avatar/" + hashlib.md5(mac.lower()).hexdigest() + "?"
    gravatar_url += urllib.urlencode({'d':'monsterid', 's':str(size)})
    return gravatar_url

@ensure_function_marble('database')
def action_index(marble):
    return marble.render(
        'index/index.page',
        msg = 'hello world!',
        person_list = marble.bag.database.query('select * from person'),
        grav_image = grav_image,
    )
