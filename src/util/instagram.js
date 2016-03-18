var config = require('config'),
    instagram = require('instagram-node').instagram(),
    Promise = require('promise');


instagram.use({
    client_id: config.get('instagram.client_id'),
    client_secret: config.get('instagram.client_secret')
});


var getOAuthRedirectUrl = function() {
    return instagram.get_authorization_url(config.get('instagram.redirect_uri'), {
        scope: config.get('instagram.scopes')
    });
};

var loadAccount = function(code) {
    return new Promise(function(resolve, reject) {
        instagram.authorize_user(code, config.get('instagram.redirect_uri'), function(err, result) {
            if (err) {
                reject(err);
            }
            else {
                var account = result.user;
                account.access_token = result.access_token;

                resolve(account);
            }
        });
    });
};


module.exports = {
    getOAuthRedirectUrl: getOAuthRedirectUrl,
    loadAccount: loadAccount
};