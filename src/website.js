var compression = require('compression'),
    config = require('config'),
    ect = require('ect'),
    express = require('express'),

    controllers = require('./controllers'),
    log = require('./util/log'),

    port = config.get('website.port');


process.on('uncaughtException', function(err) {
    console.error(err.stack);
});

require('promise/lib/rejection-tracking').enable({
    allRejections: true
});


express()
    .use('/static', express.static('static'))
    .use('/static/js/angular.min.js', express.static('node_modules/angular/angular.min.js'))
    .use('/static/js/angular.min.js.map', express.static('node_modules/angular/angular.min.js.map'))
    .use('/static/css/pure-grid.min.css', express.static('node_modules/purecss/build/grids-min.css'))

    .use(compression())
    .use(controllers)

    .set('view engine', 'ect')
    .engine('ect', ect({
        watch: true,
        root: __dirname + '/../views'
    }).render)

    .listen(port, function() {
        log.appState('website', 'started at port ' + port);
    });