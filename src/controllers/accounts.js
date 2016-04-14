var config = require('config'),
    Promise = require('promise'),
    router = require('express').Router(),
    
    accounts = require('../models/account'),
    clf = require('../ml/classifier').load();


var handleAccountError = function(res, err) {
    res.render('errors/account', {
        err: err
    });
};

router.get('/:id', function(req, res) {
    var id = req.params.id;

    accounts
        .load(id)
        .then(function(accountInfo) {
            res.render('account', {
                account: accountInfo
            });
        }, function(err) {
            handleAccountError(res, err);
        });
});

router.get('/:id/related.json', function(req, res) {
    var id = req.params.id;

    accounts
        .load(id)
        .then(function(accountInfo) {
            var attempts = 0;

            var retry = function() {
                if (attempts++ > config.get('website.collect_retry_max_attempts')) {
                    res.json({ good: [], bad: [] });
                    return;
                }

                accounts
                    .enumerateRelated(accountInfo)
                    .then(function(related) {
                        if (related.length == 0) {
                            // Probably still loading, lets retry in a few seconds
                            setTimeout(retry, config.get('website.collect_retry_interval_ms'));
                            return;
                        }

                        related = related.map(function(account) {
                            account.goodClassProbability = clf.getGoodClassProbability(account);

                            return account;
                        });

                        res.json({
                            good: related.filter(function(account) { return account.goodClassProbability >= .5; }),
                            bad: related.filter(function(account) { return account.goodClassProbability < .5; })
                        });
                    });
            };

            retry();
        }, function(err) {
            handleAccountError(res, err);
        });
});

router.get('/:accountId/related/:relatedId/tag/:tag', function(req, res) {
    var accountId = req.params.accountId,
        relatedId = req.params.relatedId,
        tag = req.params.tag;

    accounts
        .setTagToRelated(accountId, relatedId, tag)
        .then(function() {
            res.redirect('/accounts/' + accountId);
        }, function(err) {
            handleAccountError(res, err);
        });
});

router.get('/:accountId/related/:relatedId/block', function(req, res) {
    var accountId = req.params.accountId,
        relatedId = req.params.relatedId,
        type = 'manual';

    accounts
        .blockRelated(accountId, relatedId, type)
        .then(function() {
            res.redirect('/accounts/' + accountId);
        }, function(err) {
            handleAccountError(res, err);
        });
});

router.get('/:accountId/related/:relatedId/unblock', function(req, res) {
    var accountId = req.params.accountId,
        relatedId = req.params.relatedId;

    accounts
        .unblockRelated(accountId, relatedId)
        .then(function() {
            res.redirect('/accounts/' + accountId);
        }, function(err) {
            handleAccountError(res, err);
        });
});

router.get('/:accountId/watch', function(req, res) {
    var accountId = req.params.accountId;

    accounts
        .watch(accountId)
        .then(function() {
            res.redirect('/accounts/' + accountId);
        }, function(err) {
            handleAccountError(res, err);
        });
});

router.get('/:accountId/unwatch', function(req, res) {
    var accountId = req.params.accountId;

    accounts
        .unwatch(accountId)
        .then(function() {
            res.redirect('/accounts/' + accountId);
        }, function(err) {
            handleAccountError(res, err);
        });
});

router.get('/:accountId/block-and-watch', function(req, res) {
    var accountId = req.params.accountId,
        type = 'manual';

    var one = false;

    var block = accounts
        .load(accountId)
        .then(function(accountInfo) {
            return accounts
                .enumerateRelated(accountInfo)
                .then(function(related) {
                    related = related.filter(function(account) {
                        return clf.getGoodClassProbability(account) < 0.5;
                    }).map(function(account) {
                        if (one) {
                            return Promise.resolve('two');
                        }
                        one = true;
                        console.log('Blocking:');
                        console.log(account);
                        return accounts.blockRelated(accountId, account.id, type);
                    });

                    return Promise.all(related);
                });
        });

    var watch = accounts.watch(accountId);

    Promise
        .all([block, watch])
        .then(function(result) {
            res.redirect('/accounts/' + accountId);
        }, function(err) {
            // TODO: Change after approval
            res.redirect('/accounts/' + accountId);
            // handleAccountError(res, err);
        });
});


module.exports = router;