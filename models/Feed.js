var redis = require("redis"),
	client = redis.createClient(),
	async = require('async'),
	Item = require('./Item');

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

Feed.find = function(feed_id, cb){
	var dict = {};
	dict.uid = feed_id.toString();
	var baseString = "feed:"+feed_id;
	client.smembers(baseString+":tags", function(err, tagsBuffer){
		dict.tags = tagsBuffer.toString().split(','); 
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


Feed.toOPML = function(dict){
	return "<outline text=\"" + dict.title + "\" description=\"\" title=\"" + dict.title + "\" type = \"rss\" version=\"RSS\" html_Url = \""+dict.html_url+ "\" xmlUrl=\"" + dict.rss_url +"\"/>";
};

Feed.prototype.toJSON = function(){
	return {"uid":this.uid,"rss_url": this.rss_url,"html_url":this.html_url, "title":this.title};
};

Feed.prototype.toOPML = function(){
	var string = "<outline text=" + this.title + " description=\"\" title=" + this.title + " type = \"rss\" version=\"RSS\" html_Url = "+this.html_url+ " xmlUrl=" + this.rss_url +"/>";
	return string;
};

Feed.prototype.update = function(hash){
	if(hash.title !== undefined){this.title = hash.title;}
	if(hash.rss_url !== undefined){this.rss_url = hash.rss_url;}
	if(hash.html_url !== undefined){this.html_url = hash.html_url;}	
};

Feed.prototype.valid = function(){
	return (this.title !== undefined && this.rss_url !== undefined && this.html_url !== undefined);
};

Feed.prototype.destroy = function(cb){
	var baseString = "feed:"+this.uid;
	client.del([baseString+":title", baseString+":html_url", baseString+":rss_url"], function(err, retVal){
		cb(true);
	});
};

Feed.prototype.items = function(cb){
	var itemsString = "feed:"+this.uid+":items";
	client.smembers(itemsString, function(err, value){
		var ids = value.toString().split(',');
		async.map(ids, Item.find, function(err, results){
			cb(results);
		});
	});
};

Feed.prototype.add_tag = function(tag, cb){
	var feed = this;
	var baseString = "feed:"+this.uid;
	client.sadd(baseString+":tags", tag, function(err, retVal){
		feed.tags = feed.tags.concat(tag);
		cb(feed);
	});
};

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

Feed.prototype.store_values = function(cb){
	var feed = this;
	var baseString = "feed:";
	client.set(baseString+feed.uid+":title", feed.title, function(err, success){
		if(success == "OK"){
			client.set(baseString+feed.uid+":rss_url", feed.rss_url, function(err, success){
				if(success == "OK"){
					client.set(baseString+feed.uid+":html_url", feed.html_url, function(err, success){
						if(success == "OK"){
							client.sadd(feed.user_id+":feeds", feed.uid, function(err, retVal){
								cb(true);
							});
						}else{
							cb(false);
						}
					});
				}else{
					cb(false);
				}
			});
		}else{
			cb(false);
		}
	});
};

module.exports = Feed;