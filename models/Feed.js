/*
 Pull in deps.
*/
var redis = require("redis"),
	client = redis.createClient(),
	async = require('async'),
	Item = require('./Item');

/*
 Feed encapsulates the feed-specific operations performed by the API.
 @constructor
*/
function Feed(hash){
	if(hash !== undefined){
		this.uid = hash.uid;
		this.title = hash.title;
		this.rss_url = hash.rss_url;
		this.html_url = hash.html_url;
		this.user_id = '';
		this.tags = hash.tags;
	}
}

/*
 Generates an instanced of Feed with values retrieved from Redis given a feed's UID.
 @param {String} feed_id The UID of the feed you wish to find.
 @return {Feed} A Feed instance with all values filled in
*/
Feed.find = function(feed_id, cb){
	var dict = {};
	dict.uid = feed_id.toString();
	var baseString = "feed:"+feed_id;
	client.smembers(baseString+":tags", function(err, tagsBuffer){
		if(tagsBuffer !== null){dict.tags = tagsBuffer.toString().split(',');}
		client.get(baseString+":title", function(err, title){
			if(title !== null) { dict.title = title.toString();}
			client.get(baseString+":rss_url", function(err, rss_url){
				if(rss_url !== null) {dict.rss_url = rss_url.toString();}
				client.get(baseString+":html_url", function(err, html_url){
					if(html_url !== null){dict.html_url = html_url.toString();}
					var newFeed = new Feed(dict);
					cb(err, newFeed);
				});
			});
		});
	});
};

/*
 Generates the OPML line for a given feed.
 @param {Feed} feed The Feed to convert.
 @return {String} OPML Line based on the given feed.
*/
Feed.toOPML = function(feed){
	return "<outline text=\"" + feed.title + "\" description=\"\" title=\"" + feed.title + "\" type = \"rss\" version=\"RSS\" html_Url = \""+feed.html_url+ "\" xmlUrl=\"" + feed.rss_url +"\"/>";
};

/*
 Generates the JSON representation of a feed object.
 @return {Hash} JSON-encoded representation of a feed.
*/
Feed.prototype.toJSON = function(){
	return {"uid":this.uid,"rss_url": this.rss_url,"html_url":this.html_url, "title":this.title};
};

/*
 Updates the values of a Feed from a new hash.
 @param {Hash} hash The hash of values to be assigned to the feed.
*/
Feed.prototype.update = function(hash){
	if(hash.title !== undefined){this.title = hash.title;}
	if(hash.rss_url !== undefined){this.rss_url = hash.rss_url;}
	if(hash.html_url !== undefined){this.html_url = hash.html_url;}	
};

/*
 Checks a feeds to see if it has the necessary values filled in.
 @return {Boolean} true if the Feed is valid, false if it is not.
*/
Feed.prototype.valid = function(){
	return (this.title !== undefined && this.rss_url !== undefined && this.html_url !== undefined);
};

/*
 Deletes all record of a Feed
 @param {Function(trueOrFalse)} cb A callback function to continue work based on wether or not the feed was successfully deleted.
 @return {Boolean} Indicates wether or not the delete was successful.
*/
Feed.prototype.destroy = function(cb){
	var baseString = "feed:"+this.uid;
	client.del([baseString+":title", baseString+":html_url", baseString+":rss_url"], function(err, retVal){
		cb(true);
	});
};

/*
 Retrieves the data for each Item associated with a given feed. Defined as a class method so that it can be used in async methods.
 @param {Feed} feed The feed you want to retrieve the items for.
 @param {function(err, results)} cb The function that will receieve the array of items and any errors that might have occurred.
 @return {Error} err Any errors encurred while looking up Items.
 @return {Array} results An Array of Items with info retrieved from Redis
*/
Feed.items = function(feed, cb){
	var itemsString = "feed:"+feed.uid+":items";
	client.smembers(itemsString, function(err, value){
		var ids = value !== null ? value.toString().split(',') : [];
		async.map(ids, Item.find, function(err, results){
			cb(err, results);
		});
	});
};

/*
 Adds a tag to a Feed's list of tags(or folders)
 @param {String} tag The tag you wish to add to a feed.
 @param {function(feed)} cb A callback function that gets this feed instance as it's parameter to continue work on a feed.
 @return {Feed} feed The feed after the given tag has been added.
*/
Feed.prototype.add_tag = function(tag, cb){
	var feed = this;
	var baseString = "feed:"+this.uid;
	client.sadd(baseString+":tags", tag, function(err, retVal){
		feed.tags = feed.tags.concat(tag);
		cb(feed);
	});
};

/*
 Asks a Feed to commit it's data to Redis.
 @param {Function} cb A callback function that accepts on boolean argument indicating wether or not the save succeeded.
 @return {Boolean} An indication of wether or not the save succeeded.
*/
Feed.prototype.save = function(cb){
	var feed = this;
	if(this.valid()){
		if(feed.uid === undefined){
			client.incr('feed_id', function(err, newid){
				feed.uid = newid;
				this.store_values(cb);
			});
		}else{
			this.store_values(cb);
		}
	}else{
		cb(false);
	}
};

/*
 Actually asks a Feed to commit it's data to Redis. Schema for a feed works like so:
 feed:uid:title, feed:uid:rss_url, feed:uid:html_url, feeds {feed:uid}
 @private
 @param {Function} cb A callback function that accepts on boolean argument indicating wether or not the save succeeded.
 @return {Boolean} An indication of wether or not the save succeeded.
*/
Feed.prototype.store_values = function(cb){
	var feed = this;
	var baseString = "feed:"+feed.uid;
	var valuesAndKeys = [baseString+":title", feed.title, baseString+":rss_url", feed.rss_url, baseString+":html_url", feed.html_url];
	client.mset(valuesAndKeys, function(err, response){
		if(response === "OK"){
			client.sadd(feed.user_id+":feeds", feed.uid, function(err, retVal){
				cb(true);
			});
		}else{
			cb(false);
		}
	});
};

module.exports = Feed;