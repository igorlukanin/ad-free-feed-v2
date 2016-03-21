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


module.exports = router;