var compression = require('compression'),
    config = require('config'),
    ect = require('ect'),
    express = require('express'),
    instagram = require('instagram-private-api').V1,

    controllers = require('./controllers'),
    log = require('./util/log'),
    clf = require('./ml/classifier').load(),

    port = config.get('website.port');


process.on('uncaughtException', function(err) {
    console.error(err.stack);
});

require('promise/lib/rejection-tracking').enable({
    allRejections: true
});


const username = config.get('instagram.username');
const password = config.get('instagram.password');
const followersLimit = config.get('instagram.followersLimit');
const device = new instagram.Device(username);
const storage = new instagram.CookieFileStorage(__dirname + '/../config/cookies.json');
const session = instagram.Session.create(device, storage, username, password);


express()
    .use('/static', express.static('static'))
    .use('/static/js/angular.min.js', express.static('node_modules/angular/angular.min.js'))
    .use('/static/js/angular.min.js.map', express.static('node_modules/angular/angular.min.js.map'))
    .use('/static/css/pure-grid.min.css', express.static('node_modules/purecss/build/grids-min.css'))

    .use(compression())
    .use(controllers)

    .get('/demo', (req, res) => res.render('demo'))

    .get('/check.json', (req, res) => {
        if (req.query.username === undefined || req.query.username === '') {
            res.json({ err: 'Empty username' });
            return;
        }

        session.then(session => {
            instagram.Account.searchForUser(session, req.query.username)
                .then(account => {
                    new instagram.Feed.AccountFollowers(session, account.id, followersLimit).get()
                        .then(result => {
                            const followers = result
                                .slice(0, followersLimit)
                                .map(account => account._params);

                            Promise.all(followers.map(follower => {
                                return instagram.Account.getById(session, follower.id).then(result => {
                                    const account = {
                                        account_id: result._params.id,
                                        bio: result._params.biography,
                                        counts: {
                                            followed_by: result._params.followerCount,
                                            follows: result._params.followingCount,
                                            media: result._params.mediaCount
                                        },
                                        full_name: result._params.fullName,
                                        profile_picture: result._params.picture,
                                        username: result._params.username,
                                        website: result._params.externalUrl,
                                        is_private: result._params.isPrivate
                                    };

                                    account.good = clf.getGoodClassProbability(account);
                                    return account;
                                });
                            }))
                            .then(followers => followers.filter(follower => !follower.is_private))
                            .then(followers => {
                                console.log(followers);
                                res.json({ followers });
                            })
                            .catch(err => {
                                res.json({ err: 'API failure' });
                            })
                        });
                })
                .catch(err => {
                    res.json({ err: 'Wrong username' });
                });
        });
    })

    .set('view engine', 'ect')
    .engine('ect', ect({
        watch: true,
        root: __dirname + '/../views'
    }).render)

    .listen(port, function() {
        log.appState('website', 'started at port ' + port);
    });