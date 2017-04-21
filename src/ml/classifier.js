var brain = require('brain'),
    fs = require('fs'),

    account = require('./account'),

    statePath = __dirname + '/../../config/classifier-state.json',
    limitsPath = __dirname + '/../../config/classifier-limits.json';


var dummyClassifier = {
    run: function (x) {
        return account.getDefaultClasses();
    }
};

var loadState = function() {
    return fs.existsSync(statePath) ? require(statePath) : undefined;
};

var recreateClassifier = function(state) {
    var net = new brain.NeuralNetwork();
    net.fromJSON(state);

    return net;
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

var trainClassifier = function(V, limits) {
    var Y = V.map(account.toClasses),
        X = V.map(function(v) {
            return applyLimits(account.toFeatures(v), limits);
        });

    var net = new brain.NeuralNetwork();
    net.train(makeTrainData(X, Y));

    return net;
};

var loadLimits = function() {
    return fs.existsSync(limitsPath) ? require(limitsPath) : {};
};

var applyLimits = function(x, limits) {
    for (feature in x) { if (x.hasOwnProperty(feature)) {
        if (limits[feature]) {
            x[feature] = (x[feature] - limits[feature].min) / (limits[feature].max - limits[feature].min);

            if (x[feature] < 0) {
                x[feature] = 0;
            }
            else if (x[feature] > 1) {
                x[feature] = 1;
            }
        }
        else {
            x[feature] = x[feature] == 0 ? 0 : 1;
        }
    }}

    return x;
};

var init = function(clf, limits) {
    var getGoodClassProbability = function(v) {
        return clf.run(applyLimits(account.toFeatures(v), limits)).good;
    };

    var getScore = function(V) {
        var scores = V.map(function(v) {
            var score1 = account.toClasses(v).good;
            var score2 = getGoodClassProbability(v);

            return Math.round(score2) === score1 ? 1 : 0;
        });

        return scores.reduce(function(a, b) { return a + b; }) / scores.length;
    };

    return {
        getGoodClassProbability: getGoodClassProbability,
        getScore: getScore
    };
};

var load = function() {
    var state = loadState(),
        clf = state ? recreateClassifier(state) : dummyClassifier,
        limits = loadLimits();

    return init(clf, limits);
};

var train = function(V) {
    var limits = account.toLimits(V),
        clf = trainClassifier(V, limits);

    return init(clf, limits);
};

var update = function(V) {
    var limits = account.toLimits(V),
        clf = trainClassifier(V, limits);

    fs.writeFileSync(statePath, JSON.stringify(clf.toJSON(), null, 2));
    fs.writeFileSync(limitsPath, JSON.stringify(limits, null, 2));
};


module.exports = {
    load: load,
    train: train,
    update: update
};