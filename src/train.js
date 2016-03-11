var clf = require('./ml/classifier'),
    db = require('./util/db'),
    log = require('./util/log');


process.on('uncaughtException', function(err) {
    console.error(err.stack);
});

require('promise/lib/rejection-tracking').enable({
    allRejections: true
});


log.appState('train', 'started');

db.c.then(function(c) {
    db
        .accounts.run(c)
        .then(function(cursor) {
            return cursor.toArray();
        })
        .then(function(accounts) {
            log.appState('train', 'training with ' + accounts.length + ' vectors...');

            var old = clf.load(),
                trained = clf.train(accounts),
                old_score = old.getScore(accounts),
                trained_score = trained.getScore(accounts);

            log.appState('train', 'old score: ' + old_score);
            log.appState('train', 'new score: ' + trained_score);

            if (trained_score < old_score) {
                clf.update(accounts);

                log.appState('train', 'classifier updated');
            }
        })
        .then(function() {
            c.close();
        });
});