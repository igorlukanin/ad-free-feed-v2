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




// var id = '416385929';
// var token = '416385929.571b6fe.86f8ef4f45974355ad5ff08f66be59a7';

// var sandbox_id = '3023436345';

// instagram.use({ access_token: token });

// instagram.user(id, function(err, result, remaining, limit) {
//     console.log(err);
//     console.log(result);
// });

// var addAccount = function(account, cb) {
//     instagram.user_search(account, function(err, result, remaining, limit) {
//         if (err || result.length == 0) {
//             return;
//         }
//
//         var id = result[0].id;
//
//         instagram.user(id, function(err, result, remaining, limit) {
//             if (err) {
//                 console.log(account);
//                 console.log(err);
//                 return;
//             }
//
//             cb(result);
//         });
//     });
// };
//
// db.c.then(function(c) {
//     accounts.bad.forEach(function(account) {
//         addAccount(account, function(result) {
//             result.tag = 'bad';
//             db.accounts.insert(result).run(c);
//
//             console.log(account);
//         });
//     });
// });

// instagram.set_user_relationship(sandbox_id, 'unblock', function(err, result, remaining, limit) {
//     console.log(err);
//     console.log(result);
// });