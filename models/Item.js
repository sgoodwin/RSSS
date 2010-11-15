function Item(hash){
	this.uid = "foodbabe92"
	this.status = "unread";
	var d = new Date();
	this.date_modified = d.toUTCString();
};

Item.prototype.toJSON = function(){
	return {"uid":this.uid,"status": this.status};
}
module.exports = Item;