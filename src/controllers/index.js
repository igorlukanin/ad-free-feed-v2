var router = require('express').Router(),

    accounts = require('../models/account');


var handleIndexError = function(res, err) {
    res.render('errors/account', {
        err: err
    });
};

router.get('/', function(req, res) {
    accounts
        .enumerate()
        .then(function(accountInfos) {
            res.render('index', {
                accounts: accountInfos
            });
        }, function(err) {
            handleIndexError(res, err);
        });
});

router.use('/login', require('./login'));
router.use('/accounts', require('./accounts'));


module.exports = router;