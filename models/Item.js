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
		this.feedID = hash.feedID;
		this.dateModified = hash.dateModified;
	}
}

/*
 Asynchronously updates a status item's information from the given array of hashes.
 @param {Array} arrayOfdicts An array of status hashes ( {'uid':'someitemuid','status':'read'})
 @param {function(trueOrFalse)} cb A callback function that gets true or false as it's input value;
 @return {Boolean} True or False depending on wether or not the updates were successful.
*/
Item.updateStatuses = function(arrayOfdicts, cb){
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

/*
 Retrieves the information about a specific item.
 @param {String} itemID An item's uid.
 @param {function(err, item)} cb A callback that recieves possible errors along with an instance of Item with the retrieved values filled in.
 @return {Feed} feed The retrieved feed.
 @return {Error} err Any possible errors that occurred.
*/
Item.find = function(itemID, cb){
	var dict = {};
	dict.uid = itemID.toString();
	var baseString = "item:"+itemID;
	var keys = [baseString+":status", baseString+":dateModified", baseString+":feedID"];
	client.mget(keys, function(err, results){
		if(results[0] !== null){dict.status = results[0].toString();}
		if(results[1] !== null){dict.dateModified = results[1].toString();}
		if(results[2] !== null){dict.feedID = results[2].toString();}
		var newItem = new Item(dict);
		cb(err, newItem);
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
	return (this.uid !== undefined && this.status !== undefined && this.dateModified !== undefined);
};

/*
 Asks an Item to commit it's data back to Redis.
 @param {function(trueOrFalse)} cb A callback function which is told wether or not the save succeeded.
 @return {Boolean} Wether or not the save succeeded.
*/
Item.prototype.save = function(cb){
	var item = this;
	if(item.valid()){
		item.storeValues(cb);
	}else{
		cb(false);
	}
};

/*
 Actually asks an Item to store it's values in Redis.
 @private
*/
Item.prototype.storeValues = function(cb){
	var item = this;
	var baseString = "item:"+item.uid;
	var valuesAndKeys = [baseString+":status", item.status, baseString+":feedID", item.feedID, baseString+":dateModified", item.dateModified];
	client.mset(valuesAndKeys, function(err, response){
		if(response === "OK"){
			client.sadd('feed:'+item.feedID+":items", item.uid, function(err, response){
				cb(true);
			});
		}else{
			cb(false);
		}
	});
};
module.exports = Item;