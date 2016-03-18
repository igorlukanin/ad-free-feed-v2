var config = require('config'),
    instagram = require('instagram-node').instagram(),
    Promise = require('promise');


instagram.use({
    client_id: config.get('instagram.client_id'),
    client_secret: config.get('instagram.client_secret')
});


var useAccessToken = function(access_token) {
    instagram.use({ access_token: access_token });
};

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
                useAccessToken(result.access_token);

                instagram.user(result.user.id, function(err, accountInfo) {
                    if (err) {
                        reject(err);
                    }

                    accountInfo.access_token = result.access_token;

                    resolve(accountInfo);
                });
            }
        });
    });
};


module.exports = {
    useAccessToken: useAccessToken,
    getOAuthRedirectUrl: getOAuthRedirectUrl,
    loadAccount: loadAccount
};