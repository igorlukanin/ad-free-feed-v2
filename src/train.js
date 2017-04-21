var clf = require('./ml/classifier'),
    db = require('./util/db'),
    log = require('./util/log'),

    groupedAccounts = require('../config/classifier-accounts.json'),
    allAccounts = groupedAccounts.good.concat(groupedAccounts.bad);


process.on('uncaughtException', function(err) {
    console.error(err.stack);
});

require('promise/lib/rejection-tracking').enable({
    allRejections: true
});


log.appState('train', 'started');

db.c.then(function(c) {
    // TODO: Move data extraction to 'models/account.js'
    db
        .accounts
        .filter(row => db.r.expr(allAccounts).contains(row('username')))
        // .filter(db.r.row('tag'))
        // .eqJoin('related_id', db.accounts)
        // .zip()
        .run(c)
        .then(function(cursor) {
            return cursor.toArray();
        })
        .then(function(accounts) {
            accounts.forEach(account => {
                account.tag = groupedAccounts.good.indexOf(account.username) !== -1 ? 'good' : 'bad';
            });

            log.appState('train', 'training with ' + accounts.length + ' vectors...');

            var old = clf.load(),
                trained = clf.train(accounts),
                old_score = old.getScore(accounts),
                trained_score = trained.getScore(accounts);

            log.appState('train', 'old score: ' + old_score.toFixed(6));
            log.appState('train', 'new score: ' + trained_score.toFixed(6));

            if (trained_score > old_score) {
                clf.update(accounts);

                log.appState('train', 'classifier updated');
            }
        })
        .then(function() {
            c.close();
        });
});