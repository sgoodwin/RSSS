var redis = require("redis"),
	client = redis.createClient(),
	async = require('async'),
	Feed = require('./Feed');

// User: holds no personal data, only used to tell people's feeds/folders apart;
// schema: user:someid, user:folders ()

function User(akey){
	if(akey != undefined){
		this.key = akey;
	}
};

User.prototype.valid = function(){
	return (this.key != undefined);
}

User.prototype.save = function(cb){
	var user = this;
	// Generate a new key if you need to.
	if(this.key == undefined){
		client.incr('user_id', function(err, newid){
			user.key = newid; // Might wanna do some hashing or combine this key with the date or some such.
			client.sadd("users", user.key, function(err, retVal){
				cb(true);
			});
		});
	};
};


User.prototype.toJSON = function(){
	return {"user":this.key};
};

User.prototype.exists = function(cb){
	if(this.key == undefined){cb(false)};
	client.sismember("users", this.key, function(err, exists){
		if(exists == 0){ cb(false)};
		if(exists == 1){ cb(true)};
	});
};

User.prototype.feeds = function(cb){
	var feedsString = this.key+':feeds';
	client.smembers(feedsString, function(err, value){
		var ids = value.toString().split(',');
		async.map(ids, Feed.find, function(err, results){
			cb(results);
		});
	});
};

User.prototype.add_feed = function(hash, cb){
	var feed = new Feed(hash);
	feed.user_id = this.key;
	feed.save(function(success){
		cb(success, feed);
	})
};

User.prototype.status_updates_since = function(date, cb){
	this.feeds(function(results){
		async.concat(results, Feed.items, function(err, results){
			async.filter(results, function(item, cb){
				var itemDate = new Date(item.date_modified);
				if(itemDate > date){
					cb(true);
				}else{
					cb(false);
				}
			}, cb);
		});
	});
};

module.exports = User;