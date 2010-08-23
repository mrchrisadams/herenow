from pipestack.ensure import ensure_function_marble
import urllib, hashlib

def grav_image(mac, size=200):
    gravatar_url = "http://www.gravatar.com/avatar/" + hashlib.md5(mac.lower()).hexdigest() + "?"
    gravatar_url += urllib.urlencode({'d':'monsterid', 's':str(size)})
    return gravatar_url

@ensure_function_marble('mongo')
def action_index(marble):
    return marble.render(
        'index/index.page',
        msg = 'hello world!',
        person_list = marble.bag.mongo.person.find(),
        grav_image = grav_image,
    )
