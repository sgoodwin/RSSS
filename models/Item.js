var redis = require("redis"),
	client = redis.createClient(),
	async = require('async');

function Item(hash){
	if(hash !== undefined){
		this.uid = hash.uid;
		this.status = hash.status;
		this.feed_id = hash.feed_id;
		this.date_modified = hash.date_modified;
	}
}

Item.update_statuses = function(arrayOfdicts, cb){
	async.forEach(JSON.parse(arrayOfdicts),
		function(dict, cb){
			Item.find(dict.uid, function(err, item){
				if(dict.status !== undefined){item.status = dict.status;}
				item.save(function(success){
					cb(undefined);
				});
			});
		}, 
		function(err){
			cb(true);
		});
};

Item.find = function(item_id, cb){
	var dict = {};
	dict.uid = item_id.toString();
	var baseString = "item:"+item_id;
	client.get(baseString+":uid", function(err, uid){
		if(uid !== null) { dict.uid = uid.toString();}
		client.get(baseString+":status", function(err, status){
			if(status !== null) {dict.status = status.toString();}
			client.get(baseString+":date_modified", function(err, date_modified){
				if(date_modified !== null){dict.date_modified = date_modified.toString();}
				client.get(baseString+":feed_id", function(err, feed_id){
					if(feed_id !== null){dict.feed_id = feed_id.toString();}
					var newItem = new Item(dict);
					cb(err, newItem);
				});
			});
		});
	});
};


Item.prototype.toJSON = function(){
	return {"uid":this.uid,"status": this.status};
};

Item.prototype.valid = function(){
	return (this.uid !== undefined && this.status !== undefined && this.date_modified !== undefined);
};

Item.prototype.save = function(cb){
	var item = this;
	if(item.valid()){
		item.store_values(cb);
	}else{
		cb(false);
	}
};

Item.prototype.store_values = function(cb){
	var item = this;
	var baseString = "item:";
	client.set(baseString+item.uid+":status", item.status, function(err, success){
		if(success == "OK"){
			client.set(baseString+item.uid+":date_modified", item.date_modified, function(err, success){
				if(success == "OK"){
					client.set(baseString+item.uid+":feed_id", item.feed_id, function(err, success){
						if(success == "OK"){
							client.sadd("feed:"+item.feed_id+":items", item.uid, function(err, retVal){
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
module.exports = Item;