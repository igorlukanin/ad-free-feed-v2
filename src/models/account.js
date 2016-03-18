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
            .then(function(cursor) {
                return cursor.toArray();
            });
    });
};


module.exports = {
    create: createAccount,
    load: loadAccount,
    enumerate: enumerateAccounts
};