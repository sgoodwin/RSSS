var express = require('express'),
connect = require('connect'),
redis = require("redis"),
client = redis.createClient(),
User = require('./models/User.js'),
Feed = require('./models/Feed.js'),
Item = require('./models/Item.js');

// Uncomment this to see if redis is running properly:
// client.info(redis.print);

// Configuration
var app = express.createServer();
app.configure(function(){
	app.set('views', __dirname + '/app/views');
	app.use(connect.bodyDecoder());
	app.use(connect.methodOverride());
	//app.use(connect.compiler({ src: __dirname + '/public', enable: ['less'] }));
	app.use(app.router);
	//app.use(connect.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(connect.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(connect.errorHandler()); 
});

// 
// Actual requests begin here:
// 

app.get('/', function(req, res){
	res.send('Welcome to the party! We\'ve been waiting.');
});

// Possible Requests:
// GET new User (returns a new random string)
app.get('/newUser.:format?', function(req, res){
	var user = new User(req.param('key'));
	user.save(function(success){
		if(success){
			res.send(JSON.stringify(user));
		}else{
			res.send(JSON.stringify({"error":"failed to create user"}));
		}
	});
});

// Get check (returns YES if the supplied user key exists)
app.get('/check.:format?', function(req, res){
	var user = new User(req.param('key'));
	user.exists(function(exists){
		res.send(exists.toString());
	})
});

// GET subscription list
app.get('/feedlist.:format?', function(req, res){
	var user = new User(req.param('key'));
	user.exists(function(exists){
		if(exists){
			user.feeds(function(array){
				// I heart JSON.stringify
				if(req.params['format'] == 'json'){res.send(JSON.stringify(array))};
				if(req.params['format'] == 'opml'){
					// Probably not the best way to build opml, but it's 6am now...
					var string = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><!-- OPML generated by RSSS --><opml version=\"1.1\"><head><title>mySubscriptions</title></head><body>";
					for(var i =0;i<=(array.length-1);i = i+1){
						string = string.concat(Feed.toOPML(array[i]));
					}
					res.send(string.concat('</body></opml>'));
				};			
			});
		}else{
			res.send("DNE");
		};
	});
});


// POST feed (create)
app.post('/feed.:format?', function(req, res){
	var user = new User(req.param('key'));
	user.exists(function(exists){
		if(exists){
			user.add_feed(req.body, function(success, feed){
				if(success){
					res.send(JSON.stringify(feed))
				}else{
					res.send("DNE");
				}
			});
		}else{
			res.send("DNE");
		}
	});
});

// PUT feeds (update)
app.put('/feed.:format?', function(req, res){
	var user = new User(req.param('key'));
	user.exists(function(exists){
		if(exists){
			Feed.find(req.body.uid, function(err, feed){
				feed.update(req.body);
				feed.user_id = user.key;
				feed.save(function(success){
					if(exists){
						res.send("Updated JSON string: " + JSON.stringify(feed));
					}else{
						res.send("Failed to save!");
					}
				});
			})
		}else{
			res.send("DNE");
		}
	})
});

// DESTROY feeds
app.del('/feed/:uid', function(req, res){
	var user = new User(req.param('key'));
	user.exists(function(exists){
		if(exists){
			Feed.find(req.param('uid'), function(err, feed){
				if(feed !== undefined){
					feed.destroy(function(){
						res.send('OK');
					});
				}else{
					res.send('DNE');
				}
			});
		}else{
			res.send("DNE");
		}
	});
});

// GET status changes since date
app.get('/status.:format?', function(req, res){
	var user = new User(req.param('key'));
	user.exists(function(exists){
		if(exists){
			var d= new Date(req.param('dateTime'));
			user.status_updates_since(d, function(results){
				res.send(JSON.stringify(results));
			});
		}else{
			res.send('DNE');
		}
	});
});

// POST update status (input JSON/XML)
app.post('/status.:format?', function(req, res){
	var user = new User(req.param('key'));
	user.exists(function(exists){
		if(exists){
			var arrayOfDicts = req.body['data'];
			Item.update_statuses(arrayOfDicts, function(success){
				res.send(success.toString());
			});
		}else{
			res.send('DNE');
		}
	});
});

if (!module.parent) app.listen(3000);