var config = require('config'),
    instagram = require('instagram-node').instagram(),
    log = require('./util/log');


process.on('uncaughtException', function(err) {
    console.error(err.stack);
});

require('promise/lib/rejection-tracking').enable({
    allRejections: true
});


console.log();
log.appState('main', 'started');


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
// var code = '64d86ba3bd004023b8543145b6190358';
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


var id = '416385929';
var token = '416385929.7c750db.40a953fbb4a54292acb8a618d4dff09e';

var sandbox_id = '3023436345';

instagram.use({ access_token: token });

// instagram.user(id, function(err, result, remaining, limit) {
//     console.log(err);
//     console.log(result);
// });

// instagram.user_search('igorlukanin.sandbox', function(err, result, remaining, limit) {
//     console.log(err);
//     console.log(result);
// });

instagram.set_user_relationship(sandbox_id, 'block', function(err, result, remaining, limit) {
    console.log(err);
    console.log(result);
});