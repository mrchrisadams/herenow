from formbuild import Form
from pipestack.ensure import ensure_function_marble
import urllib, hashlib
from conversionkit import Conversion, Field
from formconvert import multiDictToDict
from stringconvert import unicodeToUnicode
from stringconvert.email import unicodeToEmail
from recordconvert import toRecord
from nestedrecord import encode_error

def grav_image(mac, size=200):
    gravatar_url = "http://www.gravatar.com/avatar/" + hashlib.md5(mac.lower()+'mv1SLA2r/lsa6').hexdigest() + "?"
    gravatar_url += urllib.urlencode({'d':'monsterid', 's':str(size)})
    return gravatar_url

def grav_image_from_email(email, size=200):
    gravatar_url = "http://www.gravatar.com/avatar/" + hashlib.md5(email.lower()).hexdigest() + "?"
    gravatar_url += urllib.urlencode({'d':'monsterid', 's':str(size)})
    return gravatar_url

update_status = toRecord(
     converters = dict(
         email = unicodeToEmail(),
         name = unicodeToUnicode(),
         status = unicodeToUnicode(),
     )
)
send_message = toRecord(
     converters = dict(
         msg = unicodeToUnicode(),
     )
)

@ensure_function_marble('database')
def action_index(marble):
    error = None
    value = None
    person_list = marble.bag.database.query('select * from person where expire is not NULL', format='dict')
    for person in person_list:
        if person['ip'] == marble.bag.environ['REMOTE_ADDR'] or person['mac_address'] == 'None' and marble.bag.environ['REMOTE_ADDR'] == '127.0.0.1':
            value = person
    if marble.bag.environ['REQUEST_METHOD'].upper() == 'POST':
        if not marble.bag.has_key('input'):
            marble.bag.enter('input')
        params_conversion = Conversion(
            marble.bag.input
        ).perform(
            multiDictToDict(encoding='utf-8'),
            marble.bag,
        )
        conversion = Conversion(
            params_conversion.result
        ).perform(
            update_status,
            marble.bag,
        )
        if not conversion.successful:
            error = encode_error(conversion)
            value = params_conversion.result
        else:
            if marble.bag.environ['REMOTE_ADDR'] == '127.0.0.1':
                marble.bag.database.query(
                    '''
                    UPDATE person
                    SET 
                        name = ?
                      , email = ?
                      , status = ?
                    WHERE
                        mac_address = 'None'
                    ''',
                    (
                        params_conversion.result['name'],
                        params_conversion.result['email'],
                        params_conversion.result['status'],
                    ),
                    fetch=False,
                )
            else:
                marble.bag.database.query(
                    '''
                    UPDATE person
                    SET 
                        name = ?
                      , email = ?
                      , status = ?
                    WHERE
                        ip = ?
                    ''',
                    (
                        params_conversion.result['name'],
                        params_conversion.result['email'],
                        params_conversion.result['status'],
                        marble.bag.environ['REMOTE_ADDR'],
                    ),
                    fetch=False,
                )
            person_list = marble.bag.database.query('select * from person where expire is not NULL', format='dict')
            for person in person_list:
                if person['ip'] == marble.bag.environ['REMOTE_ADDR'] or person['mac_address'] == 'None' and marble.bag.environ['REMOTE_ADDR'] == '127.0.0.1':
                #if person['ip'] == marble.bag.environ['REMOTE_ADDR']:
                    value = person
    not_here_list = marble.bag.database.query(
        '''
        SELECT * FROM person
        WHERE
            expire is NULL 
        and email is not NULL
        ''',
    )
    return marble.render(
        'index/index.page',
        msg = 'Welcome back!',
        person_list = person_list,
        not_here_list = not_here_list,
        grav_image = grav_image,
        grav_image_from_email = grav_image_from_email,
        form = Form(
            value=value,
            error=error,
            option=None,
        ),
    )

def action_msg(marble):
    error = None
    value = None
    person__uid = marble.vars['uid']
    if marble.bag.environ['REQUEST_METHOD'].upper() == 'POST':
        if not marble.bag.has_key('input'):
            marble.bag.enter('input')
        params_conversion = Conversion(
            marble.bag.input
        ).perform(
            multiDictToDict(encoding='utf-8'),
            marble.bag,
        )
        conversion = Conversion(
            params_conversion.result
        ).perform(
            send_message,
            marble.bag,
        )
        if not conversion.successful:
            error = encode_error(conversion)
            value = params_conversion.result
        else:
            raise Exception('Would have been sent')
    return marble.render(
        'index/msg.page',
        person__uid=person__uid,
        form = Form(
            value=value,
            error=error,
            option=None,
        ),
    )

