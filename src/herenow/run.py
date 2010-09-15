"""\
Example Manta CMS server

In order for this to work you'll need to run the doctests to populate the
database. The URLs ``/hello`` and ``/goodbye`` will then return pages.

"""

from pipestack.app import App, pipe, command
from dreamweavertemplate.command import DwtToJinja2
try:
    from tornadopack import ServeTornado as ServeCmd
except ImportError:
    from wsgipack.cmd import ServeCmd
from herenow.nmap import NmapCmd

class HereNow(App):
    pipes = [
        pipe('errorreport', 'errorreport:ErrorReportPipe'),
        pipe('http.input', 'httpkit.service.input:HttpInputPipe'),
        pipe('jinja2', 'jinja2pipe:Jinja2Pipe'),
        pipe('database', 'databasepipe.service.connection:DatabasePipe'),
        pipe('template', 'dreamweavertemplate.service:DwtPipe'),
        pipe('index', 'herenow.index:IndexPipe', mount_at='/'),
    ]
    commands = [
        command('serve', ServeCmd),
        command('dwt2jinja2', DwtToJinja2),
        command('nmap', NmapCmd),
    ]

app = HereNow()
app.handle_command_line(app.default_pipeline)

