var redis = require("redis"),
	client = redis.createClient();

function Feed(hash){
	this.title = hash.title;
	this.rss_url = hash.rss_url;
	this.html_url = hash.html_url;
}

Feed.find = function(feed_id, cb){
	var dict = {};
	dict.uid = feed_id.toString();
	client.get("feed:"+feed_id+":title", function(err, title){
		dict.title = title.toString();
		client.get("feed:"+feed_id+":rss_url", function(err, rss_url){
			dict.rss_url = rss_url.toString();
			client.get("feed:"+feed_id+":html_url", function(err, html_url){
				dict.html_url = html_url.toString();
				var newFeed = new Feed(dict);
				cb(err, newFeed);
			});
		});
	});
}

Feed.toOPML = function(dict){
	// Example looks like:
	// <outline text="Denver Skate Shop" description="" title="Denver Skate Shop" type="rss" version="RSS" htmlUrl="http://denverskateshop.blogspot.com/" xmlUrl="http://denverskateshop.blogspot.com/feeds/posts/default"/>
	return "<outline text=\"" + dict.title + "\" description=\"\" title=\"" + dict.title + "\" type = \"rss\" version=\"RSS\" html_Url = \""+dict.html_url+ "\" xmlUrl=\"" + dict.rss_url +"\"/>";
}

Feed.prototype.toJSON = function(){
	return {"uid":this.uid,"rss_url": this.rss_url,"html_url":this.html_url, "title":this.title};
};

Feed.prototype.toOPML = function(){
	// Example looks like:
	// <outline text="Denver Skate Shop" description="" title="Denver Skate Shop" type="rss" version="RSS" htmlUrl="http://denverskateshop.blogspot.com/" xmlUrl="http://denverskateshop.blogspot.com/feeds/posts/default"/>
	return "<outline text=" + this.title + " description=\"\" title=" + this.title + " type = \"rss\" version=\"RSS\" html_Url = "+this.html_url+ " xmlUrl=" + this.rss_url +"/>";
};

Feed.prototype.valid = function(){
	return (this.title !== undefined && this.rss_url !== undefined && this.html_url !== undefined);
};

Feed.prototype.save = function(user_id, cb){
	var feed = this;
	var baseString = "feed:";
	if(this.valid()){
		client.incr('feed_id', function(err, newid){
			feed.uid = newid;
			client.set(baseString+feed.uid+":title", feed.title, function(err, success){
				if(success == "OK"){
					client.set(baseString+feed.uid+":rss_url", feed.rss_url, function(err, success){
						if(success == "OK"){
							client.set(baseString+feed.uid+":html_url", feed.html_url, function(err, success){
								if(success == "OK"){
									client.sadd(user_id+":feeds", feed.uid, function(err, retVal){
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
		});
	}else{
		cb(false);
	}
};

module.exports = Feed;