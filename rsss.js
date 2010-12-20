/*
Pull in deps.
*/
var express = require('express'),
connect = require('connect'),
redis = require("redis"),
client = redis.createClient(),
User = require('./models/User.js'),
Feed = require('./models/Feed.js'),
Item = require('./models/Item.js');

/*
Configuration
*/
var app = express.createServer();
app.configure(function(){
	app.use(connect.bodyDecoder());
	app.use(connect.methodOverride());
	app.use(app.router);
});

app.configure('development', function(){
	app.use(connect.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(connect.errorHandler()); 
});


function checkUser(req, res, next){
	var user = new User({'key':req.param('key')});
	user.exists(function(exists){
		if(exists){
			req.user = user;
			next();
		}else{
			res.send(403);
		}
	});
}

/*
Basic request to make sure server is running.
*/

app.get('/', function(req, res){
	res.send('Welcome to the party! We\'ve been waiting.');
});

/*
GET new User (returns a new random string)
@return {Dictionary} user JSON-encoded dictionary containing new user key. 
*/
app.get('/newUser.:format?', function(req, res){
	var user = new User();
	user.save(function(success){
		if(success){
			res.send(JSON.stringify(user));
		}else{
			res.send(JSON.stringify({"error":"failed to create user"}));
		}
	});
});

/*
Get check (returns YES if the supplied user key exists)
@param {String} key User-specify key provided by newUser request.
*/
app.get('/check.:format?', function(req, res){
	var user = new User({'key':req.param('key')});
	user.exists(function(exists){
		res.send(exists.toString());
	});
});

/* 
GET subscription list
@param {String} format Specify return format as OPML or JSON
@param {String} key User-specify key provided by newUser request.
*/
app.get('/feedlist.:format', checkUser, function(req, res){
	var user = req.user;
	var modifiedSince = req.header('If-Modified-Since');
	client.get(user.key+":feedModified", function(err, value){
		var sendFeedList = function(){
			var d = new Date();
			var dateString = value === null ? d.toString() : value.toString();
			user.feeds(function(array){
				if(req.param('format') == 'json'){res.send(JSON.stringify(array), { 'Last-Modified': dateString });} // I heart JSON.stringify
				if(req.param('format') == 'opml'){res.send(Feed.opml(array), { 'Last-Modified': dateString });}
			});
		};
		if(modifiedSince !== undefined && value !== null){
			var dateA = new Date(value.toString());
			var dateB = new Date(modifiedSince);
			if(dateA < dateB){
				sendFeedList();
			}else{
				res.send(304);
			}
		}else{
			sendFeedList();
		}
	});
});


/*
POST feed (create)
@param {String} key User-specify key provided by newUser request.
@param {String} uid The new feed's uid
@param {String} title The new feed's title
@param {String} rssURL The new feed's rss url
@param {String} htmlURL The new feed's homepage url
@param {String} tags A JSON-encoded array of any Folders/Tags this feed belongs to.
*/
app.post('/feed.:format?', checkUser, function(req, res){
	var user = req.user;
	user.addFeed(req.body, function(success, feed){
		if(success){
			res.send(JSON.stringify(feed));
		}else{
			res.send("DNE", 403);
		}
	});
});

/*
PUT feeds (update)
@param {String} key User-specify key provided by newUser request.
@param {String} uid The uid of the feed you wish to update.
@param {String} title (Optional) The feed's new title
@param {String} rssURL (Optional) The feed's new rss url
@param {String} htmlURL (Optional) The feed's new homepage url
@param {String} tags (Optional) A JSON-encoded array of any Folders/Tags this feed belongs to.
*/
app.put('/feed.:format?', checkUser, function(req, res){
	var user = req.user;
	Feed.find(req.body.uid, function(err, feed){
		feed.update(req.body);
		feed.userID = user.key;
		feed.save(function(success){
			if(exists){
				res.send("Updated JSON string: " + JSON.stringify(feed));
			}else{
				res.send("Failed to save!");
			}
		});
	});
});

/*
DESTROY feeds
@param {String} key User-specify key provided by newUser request.
@pararm {String} uid The uid of the feed you wish to delete.
*/
app.del('/feed/:uid', checkUser, function(req, res){
	Feed.find(req.param('uid'), function(err, feed){
		if(feed !== undefined){
			feed.destroy(function(){
				res.send('OK');
			});
		}else{
			res.send('DNE', 403);
		}
	});
});

/*
GET status changes since date
@param {String} key User-specify key provided by newUser request.
@param {String} dateTime The earliest date you wish to retrieve status updates for.
*/
app.get('/status.:format?', checkUser, function(req, res){
	var user = req.user;
	var d= new Date(req.param('dateTime'));
	user.statusUpdatesSince(d, function(results){
		res.send(JSON.stringify(results));
	});
});

/* 
POST update status (input JSON/XML)
@param {String} key User-specify key provided by newUser request.
@param {Array} data A JSON-encoded array of status update hashes like {'uid':'peterpiperpickspepers', 'status':'read'}
*/
app.post('/status.:format?', function(req, res){
	var arrayOfDicts = req.body['data'];
	Item.updateStatuses(arrayOfDicts, function(success){
		res.send(success.toString());
	});
});

/*
Start server now.
*/
if (!module.parent) {app.listen(8080);}