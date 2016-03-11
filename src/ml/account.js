var regex = {
    emoji: require('emoji-regexp'),
    email: /\S+@\S+\.\S+/g,
    link: /(https?:\/\/[^\s]+)/g,
    phone: /[-+()\d ]{7,}/g,
    stopWord: /(whatsapp|viber|direct|sms|vk\.com)/ig
};


var getDefaultClasses = function() {
    return { good: 0.5, bad: 0.5 };
};

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
        bio_emoji_count: (bioEmoji = account.bio.match(regex.emoji)) ? bioEmoji.length : 0,
        bio_link_count: (bioLink = account.bio.match(regex.link)) ? bioLink.length : 0,
        bio_email_count: (bioEmail = account.bio.match(regex.email)) ? bioEmail.length : 0,
        bio_phone_count: (bioPhone = account.bio.match(regex.phone)) ? bioPhone.length : 0,
        bio_stop_word_count: (bioStopWord = account.bio.match(regex.stopWord)) ? bioStopWord.length : 0,
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

var toLimits = function(X) {
    var limits = {};

    X.map(toFeatures).forEach(function(x) {
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


module.exports = {
    getDefaultClasses: getDefaultClasses,
    toClasses: toClasses,
    toFeatures: toFeatures,
    toLimits: toLimits
};