var router = require('express').Router(),

    clf = require('../ml/classifier').load(),
    accounts = require('../models/account'),
    client = require('../util/instagram'),
    db = require('../util/db');


router.get('/', function(req, res) {
    accounts
        .enumerate()
        .then(function(accountInfos) {
            res.render('index', {
                accounts: accountInfos
            });
        }, function(err) {
            handleAccountError(res, err);
        });
});

router.get('/login', function(req, res) {
    res.redirect(client.getOAuthRedirectUrl());
});

var handleLoginError = function(res, err) {
    res.render('errors/login', {
        err: err
    });
};

var handleAccountError = function(res, err) {
    res.render('errors/account', {
        err: err
    });
};

router.get('/login/complete', function(req, res) {
    var code = req.query.code;

    if (code) {
        client
            .loadAccount(code)
            .then(accounts.create)
            .then(function(accountId) {
                res.redirect('/accounts/' + accountId);
            }, function(err) {
                handleLoginError(res, err);
            })
    } else {
        handleLoginError(res);
    }
});

router.get('/accounts/:id', function(req, res) {
    var id = req.params.id;

    accounts
        .load(id)
        .then(function(accountInfo) {
            accounts
                .enumerateRelated(accountInfo)
                .then(function(related) {
                    related = related.map(function(account) {
                        account.goodClassProbability = clf.getGoodClassProbability(account);
                        account.goodClassRank = Math.floor(account.goodClassProbability * 4);

                        return account;
                    });

                    res.render('account', {
                        account: accountInfo,
                        related: related
                    });
                });
        }, function(err) {
            handleAccountError(res, err);
        });
});

router.get('/accounts/:accountId/related/:relatedId/tag/:tag', function(req, res) {
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


module.exports = router;