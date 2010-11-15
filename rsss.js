var express = require('express'),
    connect = require('connect'),
	sys = require('sys'),
	redis = require("redis"),
	client = redis.createClient();
	User = require('./models/user.js');

// Uncomment this to see if redis is running properly:
// client.info(redis.print);

// Configuration
var app = express.createServer();
app.configure(function(){
    app.set('views', __dirname + '/app/views');
    app.use(connect.bodyDecoder());
    app.use(connect.methodOverride());
    app.use(connect.compiler({ src: __dirname + '/public', enable: ['less'] }));
    app.use(app.router);
    app.use(connect.staticProvider(__dirname + '/public'));
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
	var user = new User();
	res.send(user.to_json());
});

// Get check (returns YES if the supplied user key exists)
app.get('/check.:format?', function(req, res){
	var user = new User(req.query);
	user.exists(function(exists){
		res.send(exists.toString());
	})
});

// GET subscription list
app.get('/feedlist.:format?', function(req, res){
	var user = new User(req.query);
	user.exists(function(exists){
		if(exists){
			res.send("hi!");
		};
	}
});

// PUT feeds (update)
// DESTROY feeds
// GET all feeds ? (conditional GET)
// GET status changes since date
// POST update status (input JSON/XML)

if (!module.parent) app.listen(3000);