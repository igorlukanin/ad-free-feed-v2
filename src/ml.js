var config = require('config'),
    brain = require('brain'),

    db = require('./util/db'),

    emojiRegexp = require('emoji-regexp'),
    linkRegex = /(https?:\/\/[^\s]+)/g,
    emailRegex = /\S+@\S+\.\S+/g,
    phoneRegex = /[-+()\d ]{7,}/g,
    stopWordRegex = /(whatsapp|viber|direct|sms|vk\.com)/ig,

    trainSplitRatio = 0.8;


process.on('uncaughtException', function(err) {
    console.error(err.stack);
});

require('promise/lib/rejection-tracking').enable({
    allRejections: true
});


var toClasses = function(account) {
    return {
        good: account.tag == 'good' ? 1 : 0,
        bad: account.tag == 'bad' ? 1 : 0
    };
};

var toFeatures = function(account) {
    var bioEmoji, bioLink, bioEmail, bioPhone, bioStopWord;

    return {
        bio_empty: account.bio.length == 0 ? 1 : 0,
        bio_length: account.bio.length,
        bio_emoji_count: (bioEmoji = account.bio.match(emojiRegexp)) ? bioEmoji.length : 0,
        bio_link_count: (bioLink = account.bio.match(linkRegex)) ? bioLink.length : 0,
        bio_email_count: (bioEmail = account.bio.match(emailRegex)) ? bioEmail.length : 0,
        bio_phone_count: (bioPhone = account.bio.match(phoneRegex)) ? bioPhone.length : 0,
        bio_stop_word_count: (bioStopWord = account.bio.match(stopWordRegex)) ? bioStopWord.length : 0,
        bio_line_count: account.bio.split("\n").length,
        followers_count: account.counts.followed_by,
        following_count: account.counts.follows,
        media_count: account.counts.media,
        media_followers_ratio: account.counts.media / account.counts.followed_by,
        full_name_empty: account.full_name.length == 0 ? 1 : 0,
        full_name_length: account.full_name.length,
        website_empty: account.website.length == 0 ? 1 : 0
    };
};

var getFeatureLimits = function(X) {
    var limits = {};

    X.forEach(function(x) {
        for (feature in x) { if (x.hasOwnProperty(feature)) {
            if (limits[feature] == undefined) {
                limits[feature] = {
                    min: x[feature],
                    max: x[feature]
                };
            }
            else if (limits[feature].min > x[feature]) {
                limits[feature].min = x[feature];
            }
            else if (limits[feature].max < x[feature]) {
                limits[feature].max = x[feature];
            }
        }}
    });

    return limits;
};

var applyFeatureLimits = function(x, limits) {
    for (feature in x) { if (x.hasOwnProperty(feature)) {
        x[feature] = (x[feature] - limits[feature].min) / (limits[feature].max - limits[feature].min);
    }}

    return x;
};

var makeTrainData = function(X, Y) {
    var data = [];

    for (var i = 0; i < X.length; ++i) {
        data[i] = {
            input: X[i],
            output: Y[i]
        };
    }

    return data;
};

var shuffle = function(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
};


console.log();

db.c.then(function(c) {
    db
        .accounts.run(c)
        .then(function(cursor) {
            return cursor.toArray();
        })
        .then(function(accounts) {
            accounts = shuffle(accounts);

            var train = accounts.slice(0, Math.floor(accounts.length * trainSplitRatio)),
                test = accounts.slice(train.length);

            var X = accounts.map(toFeatures),
                limits = getFeatureLimits(X),
                X_train = train.map(toFeatures).map(function(x) {
                    return applyFeatureLimits(x, limits);
                }),
                Y_train = train.map(toClasses);

            var net = new brain.NeuralNetwork();
            var trainData = net.train(makeTrainData(X_train, Y_train));

            console.log(trainData);

            test.forEach(function(account) {
                x_test = applyFeatureLimits(toFeatures(account), limits);

                console.log();
                console.log(account.username);
                console.log(account.full_name);
                console.log(net.run(x_test));
            });
            // var output = net.run({ r: 1, g: 0.4, b: 0 });  // { white: 0.99, black: 0.002 }
        })
        .then(function() {
            c.close();
        });
});