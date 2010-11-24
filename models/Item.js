/*
 Pull in deps.
*/
var redis = require("redis"),
	client = redis.createClient(),
	async = require('async');

/*
 Item encapsulates the item-specific operations performed by the API.
 @constructor
*/
function Item(hash){
	if(hash !== undefined){
		this.uid = hash.uid;
		this.status = hash.status;
		this.feed_id = hash.feed_id;
		this.date_modified = hash.date_modified;
	}
}

/*
 Asynchronously updates a status item's information from the given array of hashes.
 @param {Array} arrayOfdicts An array of status hashes ( {'uid':'someitemuid','status':'read'})
 @param {function(trueOrFalse)} cb A callback function that gets true or false as it's input value;
 @return {Boolean} True or False depending on wether or not the updates were successful.
*/
Item.update_statuses = function(arrayOfdicts, cb){
	async.forEach(JSON.parse(arrayOfdicts),
		function(dict, cb){
			Item.find(dict.uid, function(err, item){
				if(dict.status !== undefined){item.status = dict.status;}
				console.log("Found Item: "+ JSON.stringify(item));
				item.save(function(success){
					cb(undefined);
				});
			});
		}, 
		function(err){
			cb(true);
		});
};

/*
 Retrieves the information about a specific item.
 @param {String} item_id An item's uid.
 @param {function(err, item)} cb A callback that recieves possible errors along with an instance of Item with the retrieved values filled in.
 @return {Feed} feed The retrieved feed.
 @return {Error} err Any possible errors that occurred.
*/
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

/*
 Controlling the JSON representation of Item
 @return {Hash} JSON-ready hash of public values.
*/
Item.prototype.toJSON = function(){
	return {"uid":this.uid,"status": this.status};
};

/*
 Checks an Item to see if it is valid.
 @return {Boolean} Wether or not the Item is valid.
*/
Item.prototype.valid = function(){
	return (this.uid !== undefined && this.status !== undefined && this.date_modified !== undefined);
};

/*
 Asks an Item to commit it's data back to Redis.
 @param {function(trueOrFalse)} cb A callback function which is told wether or not the save succeeded.
 @return {Boolean} Wether or not the save succeeded.
*/
Item.prototype.save = function(cb){
	var item = this;
	if(item.valid()){
		item.store_values(cb);
	}else{
		cb(false);
	}
};

/*
 Actually asks an Item to store it's values in Redis.
 @private
*/
Item.prototype.store_values = function(cb){
	var item = this;
	var baseString = "item:"+item.uid;
	var valuesAndKeys = [baseString+":status", item.status, baseString+":feed_id", item.feed_id, baseString+":date_modified", item.date_modified];
	client.mset(valuesAndKeys, function(err, response){
		if(response === "OK"){
			client.sadd('feed:'+item.feed_id+":items", item.uid, function(err, response){
				cb(true);
			});
		}else{
			cb(false);
		}
	});
};
module.exports = Item;