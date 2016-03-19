var accounts = require('./models/account'),
    client = require('./util/instagram'),
    log = require('./util/log');


process.on('uncaughtException', function(err) {
    console.error(err.stack);
});

require('promise/lib/rejection-tracking').enable({
    allRejections: true
});


log.appState('collect', 'started');

accounts
    .feedForUpdate()
    .then(function(cursor) {
        cursor.each(function(err, result) {
            var accountInfo = result.new_val;

            if (accountInfo && result.old_val == undefined) {
                log.appState('collect', 'loading related accounts for ' + accountInfo.id + '...');

                accounts
                    .checkFollowersLoaded(accountInfo)
                    .then(function(loaded) {
                        var loadFollowers = loaded
                            ? client.loadRecentFollowers
                            : client.loadFollowers;

                        loadFollowers(accountInfo)
                            .then(function(followers) {
                                log.appState('collect', followers.length + ' accounts loaded for ' + accountInfo.id);

                                accounts.updateFollowers(accountInfo, followers);
                            });
                    });
            }
        });
    }, function(err) {
        console.error(err);
    });