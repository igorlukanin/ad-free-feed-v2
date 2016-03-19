var debug = require('console-debug');


var console = new debug({
    uncaughtExceptionCatch: true,
    logToFile:              true,
    colors:                 true,
    consoleFilter:          [],
    logFilter:              []
});

var logAppState = function(app, message) {
    console.info(app + ': ' + message);
};


module.exports = {
    appState: logAppState
};