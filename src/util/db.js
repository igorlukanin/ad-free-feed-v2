var config = require('config'),
    Promise = require('promise'),
    r = require('rethinkdb'),

    tables = [ 'accounts', 'accounts_to_related', 'test' ];


var options = {
    host: config.get('rethinkdb.host'),
    port: config.get('rethinkdb.port'),
    db: config.get('rethinkdb.db')
};


var connect = function() {
    var c = r.connect(options);

    if (process.env.NODE_ENV == 'test') {
        c = dropAndCreateForTests(c);
    }

    return c;
};


var dropAndCreateForTests = function(conn) {
    return conn.then(function(c) {
        return new Promise(function(resolve, reject) {
            r.dbDrop(options.db).run(c, function(err) {
                // It doesn't matter whether database existed or not, so ignore 'err'
                r.dbCreate(options.db).run(c, function(err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        r.db(options.db).wait().run(c);

                        r.expr(tables).forEach(
                            r.db(options.db).tableCreate(r.row)
                        ).run(c, function(err) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                r.expr(tables).forEach(r.db(options.db).table(r.row).wait()).run(c);
                                resolve(c);
                            }
                        });
                    }
                });
            });
        });
    });
};


module.exports = {
    r: r,
    c: connect()
};

tables.forEach(function(table) {
    module.exports[table] = r.table(table);
});