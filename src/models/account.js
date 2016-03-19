var Promise = require('promise'),

    db = require('../util/db');


var createEntityId = function(entity) {
    return db.c.then(function(c) {
        return db.r.uuid(entity.id).run(c);
    });
};

var prepareForInsert = function(entity) {
    return createEntityId(entity)
        .then(function(entityId) {
            entity.account_id = entity.id;
            entity.id = entityId;
            entity.creation_date = db.r.now();
            
            return entity;
        });
};

var createAccount = function(accountInfo) {
    return db.c.then(function(c) {
        return prepareForInsert(accountInfo)
            .then(function (accountInfo) {
                return db.accounts
                    .insert(accountInfo, { conflict: 'update' }).run(c)
                    .then(function () {
                        return accountInfo.id;
                    });
            });
    });
};

var checkFollowersLoaded = function(accountInfo) {
    return db.c.then(function(c) {
        return db.accounts_to_related
            .filter({ account_id: accountInfo.id })
            .count()
            .run(c)
            .then(function(result) {
                return result > 0;
            });
    });
};

var createRelated = function(accountInfo, related, relation) {
    return db.c.then(function(c) {
        related = related.map(prepareForInsert);

        return Promise.all(related)
            .then(function(related) {
                var insert = db.accounts
                    .insert(related, { conflict: 'update' })
                    .run(c);

                var links = related.map(function(one) {
                    return {
                        account_id: accountInfo.id,
                        related_id: one.id,
                        relation: relation
                    };
                });

                var link = db.r
                    .expr(links)
                    .map(function(row) {
                        return row.merge({
                            id: db.r.uuid(row('account_id').add('_').add(row('related_id')))
                        });
                    })
                    .forEach(function(row) {
                        return db.accounts_to_related.insert(row, { conflict: 'update' });
                    })
                    .run(c);

                return Promise.all([ insert, link ]);
            });
    });
};

var loadAccount = function(accountId) {
    return db.c.then(function(c) {
        return db.accounts
            .get(accountId).run(c)
            .then(function(accountInfo) {
                if (accountInfo == null) {
                    return Promise.reject({
                        message: 'Account not found',
                        account_id: accountId
                    });
                }

                return accountInfo;
            });
    });
};

var enumerateAccounts = function() {
    return db.c.then(function(c) {
        return db.accounts
            .filter(db.r.row('access_token')).run(c)
            .then(function (cursor) {
                return cursor.toArray();
            });
    });
};

var feedAccountsForUpdate = function() {
    return db.c.then(function(c) {
        return db.accounts
            .filter(db.r.row('access_token'))
            .changes({ includeInitial: true })
            .run(c);
    });
};

var updateFollowers = function(accountInfo, followers) {
    return createRelated(accountInfo, followers, 'follower');
};

var enumerateRelatedAccounts = function(accountInfo) {
    return db.c.then(function(c) {
        return db.accounts
            .filter(db.r.row('related_to').contains(function(accountId) {
                return accountId == accountInfo.id;
            })).run(c)
            .then(function(cursor) {
                return cursor.toArray();
            });
    });
};


module.exports = {
    create: createAccount,
    checkFollowersLoaded: checkFollowersLoaded,
    load: loadAccount,
    enumerate: enumerateAccounts,
    feedForUpdate: feedAccountsForUpdate,
    updateFollowers: updateFollowers,
    enumerateRelated: enumerateRelatedAccounts
};