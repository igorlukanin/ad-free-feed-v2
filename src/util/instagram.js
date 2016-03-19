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
    // TODO: Remove ugly fix
    instagram.use({
        client_id: config.get('instagram.client_id'),
        client_secret: config.get('instagram.client_secret')
    });

    return instagram.get_authorization_url(config.get('instagram.redirect_uri'), {
        scope: config.get('instagram.scopes')
    });
};

var loadFullInfo = function(accessToken, accountId) {
    return new Promise(function(resolve, reject) {
        useAccessToken(accessToken);

        instagram.user(accountId, function(err, account) {
            if (err) {
                reject(err);
            }

            resolve(account);
        });
    });
};

var loadAccount = function(code) {
    return new Promise(function(resolve, reject) {
        instagram.authorize_user(code, config.get('instagram.redirect_uri'), function(err, result) {
            if (err) {
                reject(err);
                return;
            }

            loadFullInfo(result.access_token, result.user.id)
                .then(function(account) {
                    account.access_token = result.access_token;

                    resolve(account);
                }, function(err) {
                    reject(err);
                });
        });
    });
};

var loadFollowers = function(accountInfo, options) {
    if (options == undefined) {
        options = { all: true };
    }
    
    return new Promise(function(resolve, reject) {
        var followers = [];

        var collectFollowers = function (err, result, pagination, remaining, limit) {
            if (err) {
                reject(err);
                return;
            }

            Promise
                .all(result.map(function(follower) {
                    return loadFullInfo(accountInfo.access_token, follower.id)
                        .catch(function(err) {
                            // Skip all errors
                            return null;
                        });
                }))
                .then(function(result) {
                    followers = followers.concat(result.filter(function(one) {
                        // Filter erroneous results
                        return one != null;
                    }));

                    if (options.all && pagination.next) {
                        pagination.next(collectFollowers);
                    }
                    else {
                        resolve(followers);
                    }
                });
        };

        useAccessToken(accountInfo.access_token);

        instagram.user_followers(accountInfo.account_id, collectFollowers);
    });
};

var loadRecentFollowers = function(accountInfo) {
    return loadFollowers(accountInfo, { all: false })
};


module.exports = {
    getOAuthRedirectUrl: getOAuthRedirectUrl,
    loadAccount: loadAccount,
    loadFollowers: loadFollowers,
    loadRecentFollowers: loadRecentFollowers
};