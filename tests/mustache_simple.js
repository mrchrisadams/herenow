
var Mustache = require('mustache');
var sys = require('sys');

sys.puts(Mustache.to_html('Hello {{name}}!', {name: 'james'}));

