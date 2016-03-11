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


// var instagram = require('instagram-node').instagram(),

// instagram.use({
//     client_id: config.get('instagram.client_id'),
//     client_secret: config.get('instagram.client_secret')
// });
//
// var redirectUri = instagram.get_authorization_url(config.get('instagram.redirect_uri'), {
//     scope: config.get('instagram.scopes')
// });
//
// console.log(redirectUri);


// instagram.use({
//     client_id: config.get('instagram.client_id'),
//     client_secret: config.get('instagram.client_secret')
// });
//
// // var code = '64d86ba3bd004023b8543145b6190358';
// var code = 'f45b76fe3ee846ef9b0135c0f0d3e771';
//
// instagram.authorize_user(code, config.get('instagram.redirect_uri'), function(err, result) {
//     if (err) {
//         console.log(err);
//     } else {
//         // instagram.use({ access_token: result.access_token });
//
//         console.log(result.access_token);
//         console.log(result.user.id);
//     }
// });

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