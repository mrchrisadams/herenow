"""\
Web Server for HereNow pages
"""

import logging
import os
import sys

from appdispatch import BaseApp, AppMarble
from bn import AttributeDict, uniform_path
from conversionkit import Field, Conversion, noConversion
from pipestack.ensure import ensure, ensure_self_marble
from pipestack.pipe import MarblePipe, Marble, ConfigPipe
from stringconvert import unicodeToUnicode
from urlconvert import rule

log = logging.getLogger(__name__)

class IndexMarble(AppMarble):

    @ensure_self_marble('jinja2')
    def render(marble, template, directory=None, **args):
        if directory is None:
            template = os.path.join(marble.name, template)
        args.update(
            dict(
                marble = marble,
                isinstance = isinstance,
                enumerate = enumerate,
             )
        )
        return marble.bag.jinja2.render(template, **args)

class IndexPipe(BaseApp):
    options = dict(
    )
    marble_class = IndexMarble
    default_aliases = AttributeDict(mongo='mongo')
    urls = [
        rule(u'{*}://{*}:{*}/',            add={u'area': u'index', u'action': u'index'}),
    ]


