var router = require('express').Router(),
    
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
            accounts
                .enumerateRelated(accountInfo)
                .then(function(related) {
                    related = related.map(function(account) {
                        account.goodClassProbability = clf.getGoodClassProbability(account);

                        return account;
                    });

                    res.json({
                        good: related.filter(function(account) { return account.goodClassProbability >= .5; }),
                        bad: related.filter(function(account) { return account.goodClassProbability < .5; })
                    });
                });
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


module.exports = router;