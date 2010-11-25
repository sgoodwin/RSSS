/*
 Pull in deps.
*/
var redis = require("redis"),
	client = redis.createClient(),
	async = require('async'),
	Feed = require('./Feed');

/*
 User: holds no personal data, only used to tell people's feeds/folders apart;
 @constructor
*/
function User(hash){
	if(hash != undefined){
		this.key = hash['key'];
	}
}

/*
 Checks a User to see if it is valid.
 @return {Boolean} Wether or not a user is valid.
*/
User.prototype.valid = function(){
	return (this.key != undefined);
};

/*
 Asks a User to save it's info into Redis if it is not there already. This generates a new key for that user.
 @param {function(trueOrFalse)} cb A callback function that is told wether or not the save succeeded.
*/
User.prototype.save = function(cb){
	var user = this;
	var d = new Date();
	// Generate a new key if you need to.
	if(this.key == undefined){
		client.incr('userID', function(err, newid){
			user.key = newid; // Might wanna do some hashing or combine this key with the date or some such.
			client.sadd("users", user.key, function(err, retVal){
				client.set(user.key + ":feedModified", d.toString(), function(err, results){
					cb(true);
				});
			});
		});
	}
};

/*
 Generates the JSON representation of a User object.
 @return {Hash} JSON-encoded representation of a User.
*/
User.prototype.toJSON = function(){
	return {"user":this.key};
};

/*
 Checks wether or not the user exists in Redis.
 @param {function} cb A callback that is told wether or not the User exists.
 @return {Boolean} Wether or not the user exists.
*/
User.prototype.exists = function(cb){
	if(this.key == undefined){cb(false);}
	client.sismember("users", this.key, function(err, exists){
		if(exists === 0){ cb(false);}
		if(exists === 1){ cb(true);}
	});
};

/*
 Retrieves the feeds a given user has from Redis.
 @param {function(array)} cb A callback to recieve the requested Feeds.
 @return {Array} An array of Feed objects.
*/
User.prototype.feeds = function(cb){
	var feedsString = this.key+':feeds';
	client.smembers(feedsString, function(err, value){
		if(value === null){
			cb([]);	
		}else{
			var ids = value.toString().split(',');
			async.map(ids, Feed.find, function(err, results){
				cb(results);
			});
		}
	});
};

/*
 Addes a feed to a user's list of feeds.
 @param {Hash} hash The hash containing necessary info to create a Feed.
 @param {function(trueOrFalse, feed)} cb A callback function that is told wether or not the addition succeeded and, upon success, the created feed itself.
 @return {Boolean} success Wether or not the addition succceed.
 @return {Feed} feed The newly created feed object.
*/
User.prototype.addFeed = function(hash, cb){
	var feed = new Feed(hash);
	var user = this;
	feed.userID = this.key;
	feed.save(function(success){
		var d = new Date();
		client.set(user.key + ":feedModified", d.toString(), function(err, results){
			cb(success, feed);
		});
	});
};

/*
 Retrieves all of a user's status updates since a given date.
 @param {Date} date The earliest a requested status update should come from.
 @param {function(err, array)} cb A callback function that gets any errors generated during lookup and an array of Items successfully retrieved.
 @return {Error} Any possible errors generated during lookup.
 @return {Array} An array of all Items that have been updates since the given date.
*/
User.prototype.statusUpdatesSince = function(date, cb){
	this.feeds(function(results){
		async.concat(results, Feed.items, function(err, results){
			async.filter(results, function(item, cb){
				var itemDate = new Date(item.dateModified);
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