var Promise = require('promise'),

    client = require('../util/instagram'),
    db = require('../util/db');


// TODO: Don't create ids in separate query
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
        return db.accounts_to_related
            .filter({ account_id: accountInfo.id })
            .eqJoin('related_id', db.accounts)
            .zip()
            .run(c)
            .then(function(cursor) {
                return cursor.toArray();
            });
    });
};

var setTagToRelated = function(accountId, relatedId, tag) {
    var validateTag = tag == 'good' || tag == 'bad'
        ? Promise.resolve(tag)
        : Promise.reject(tag);

    var setTag = db.c
        .then(function(c) {
            return db
                .accounts_to_related
                .filter({
                    account_id: accountId,
                    related_id: relatedId
                })
                .update({ tag: tag })
                .run(c);
        });

    return Promise.all([ validateTag, setTag ]);
};

var blockRelated = function(accountId, relatedId, type) {
    var validateType = type == 'manual' || type == 'auto'
        ? Promise.resolve(type)
        : Promise.reject(type);
    
    var loadAccountInfo = loadAccount(accountId),
        loadRelatedInfo = loadAccount(relatedId);

    var performBlock = Promise
        .all([ loadAccountInfo, loadRelatedInfo ])
        .then(function(result) {
            var accountInfo = result[0],
                relatedInfo = result[1];

            return client.blockRelatedAccount(accountInfo, relatedInfo);
        });

    var registerBlock = db.c
        .then(function(c) {
            return db
                .accounts_to_related
                .filter({
                    account_id: accountId,
                    related_id: relatedId
                })
                .update({ block: type })
                .run(c);
        });

    return Promise.all([ validateType, performBlock, registerBlock ]);
};

var unblockRelated = function(accountId, relatedId) {
    var loadAccountInfo = loadAccount(accountId),
        loadRelatedInfo = loadAccount(relatedId);

    var performBlock = Promise
        .all([ loadAccountInfo, loadRelatedInfo ])
        .then(function(result) {
            var accountInfo = result[0],
                relatedInfo = result[1];

            return client.unblockRelatedAccount(accountInfo, relatedInfo);
        });

    var registerBlock = db.c
        .then(function(c) {
            return db
                .accounts_to_related
                .filter({
                    account_id: accountId,
                    related_id: relatedId
                })
                .replace(db.r.row.without('block'))
                .run(c);
        });

    return Promise.all([ performBlock, registerBlock ]);
};

var watchAccount = function(accountId) {
    return db.c
        .then(function(c) {
            return db
                .accounts
                .get(accountId)
                .update({ watch: true })
                .run(c);
        });
};

var unwatchAccount = function(accountId) {
    return db.c
        .then(function(c) {
            return db
                .accounts
                .get(accountId)
                .replace(db.r.row.without('watch'))
                .run(c);
        });
};


module.exports = {
    create: createAccount,
    checkFollowersLoaded: checkFollowersLoaded,
    load: loadAccount,
    enumerate: enumerateAccounts,
    feedForUpdate: feedAccountsForUpdate,
    updateFollowers: updateFollowers,
    enumerateRelated: enumerateRelatedAccounts,
    setTagToRelated: setTagToRelated,
    blockRelated: blockRelated,
    unblockRelated: unblockRelated,
    watch: watchAccount,
    unwatch: unwatchAccount
};