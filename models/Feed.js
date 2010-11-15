function Feed(hash){
	// feed_url
	// html_url
	// title
};

Feed.prototype.to_json = function(){
	return "{\"key\":\"user:"+this.key+"\"}";
}

module.exports = Feed;