var router = require('express').Router(),

    db = require('../util/db');


router.get('/', function(req, res) {
    db.c.then(function(c) {
        // db.athletes
        //     .run(c)
        //     .then(function(cursor) {
        //         return cursor.toArray();
        //     })
        //     .then(function(athleteInfos) {
        //         res.render('index', { athletes: athleteInfos });
        //     });

        res.render('index');
    });
});


module.exports = router;