var router = require('express').Router(),

    accounts = require('../models/account'),
    client = require('../util/instagram');


var handleLoginError = function(res, err) {
    res.render('errors/login', {
        err: err
    });
};

router.get('/', function(req, res) {
    res.redirect(client.getOAuthRedirectUrl());
});

router.get('/complete', function(req, res) {
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


module.exports = router;