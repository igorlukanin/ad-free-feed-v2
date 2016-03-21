var router = require('express').Router(),

    accounts = require('../models/account');


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

router.use('/login', require('./login'));
router.use('/accounts', require('./accounts'));


module.exports = router;