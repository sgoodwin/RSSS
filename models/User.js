var redis = require("redis"),
	client = redis.createClient();

// User: holds no personal data, only used to tell people's feeds/folders apart;
// schema: user:someid, user:folders ()

function User(hash){
	// Generate a new key on create unless one is provided
	if(hash != undefined && hash["key"] != undefined){
		this.key = hash["key"];
	}else{
		this.key = "defaultkeyhex"; // Some hexing should happen here.
	}
};

User.prototype.to_json = function(){
	return "{\"key\":\"user:"+this.key+"\"}";
}

User.prototype.exists = function(cb){
	client.exists(this.key, function(err, value){
		if(value == 0){ cb(false)};
		if(value == 1){ cb(true)};
	})
}

User.prototype.folders = function(cb){
	client.
}
module.exports = User;