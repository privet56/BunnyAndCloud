// BASE SETUP
// ======================================

// CALL THE PACKAGES --------------------
var express    = require('express');		// call express
var app        = express(); 				// define our app using express
var bodyParser = require('body-parser'); 	// get body-parser
var morgan     = require('morgan'); 		// used to see requests
var mongoose   = require('mongoose');
var config 	   = require('./config');
var path 	   = require('path');
var fs 		   = require('fs');
var logger	   = require('./app/logger');
var ws	  	   = require('./app/ws')(null, logger);

// APP CONFIGURATION ==================
// ====================================

/*	TODO
var getRawBody = require('raw-body');
app.use(function (req, res, next) {
	  getRawBody(req, {
	    length: req.headers['content-length'],
	    limit: '1mb'
	  },
	  function (err, string)
	  {
	    if (err) return next(err);
	    req.text = string;
	    next();
	  });
});
*/

app.use(require('cookie-parser')()); // required for session support

// use body parser so we can grab information from POST requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// configure our app to handle CORS requests
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
	next();
});

/* logger: morgan 
if (app.get('env') != 'dev')
{
	var s = fs.createWriteStream(__dirname + '/_.log',{flags: 'a'});
	app.use(morgan('common',
		  {
	  		skip: function(req, res) { if(res.statusCode == 304) { return true; } return (res.statusCode == 200); },
	  		write: function(message, encoding)
	  		{
	  	        s.write(message);
	  	    },
	  		stream: s })
	  	);
}
else
{
	app.use(morgan('dev'));
}*/
//app.use(morgan('dev'));
app.use(morgan('combined',
	{
	  skip: function (req, res) { return res.statusCode < 400 || res.statusCode == 304; }
	}
));

app.use(function(req, res, next)
{
	var skip = function(req, res) { if(res.statusCode == 304) { return true; } return (res.statusCode == 200); };
	if(!skip(req, res))
	  logger.error("res:"+res.statusCode+" req:"+res.length);
	next();
});

// connect to our database (hosted on modulus.io)
mongoose.connect(config.database, function(err)
{
    if (err)
    {
		console.error(err);
	    	logger.error("mongoose.connect.exception:"+err);
	    	//openshift-3 & -Registration temporarily unavailable!-
		//console.trace();
		//process.exit(-13*2);	//trust pm2 to restart!
    		//throw err;
    }
});
mongoose.connection.on('error',function (err)
{  
    if (err)
    {
		console.error(err);
	    	logger.error("mongoose.connect.on.error:"+err);
	    	//openshift-3 & -Registration temporarily unavailable!-
		//console.trace();
		//process.exit(-13*3);	//trust pm2 to restart!
    		//throw err;
    }
}); 

// set static files location
// used for requests that our frontend will make
app.use(express.static(__dirname + '/public'));

// ROUTES FOR OUR API =================
// ====================================

// API ROUTES ------------------------
var apiRoutes = require('./app/routes/api')(app, express);
app.use('/api', apiRoutes);

// MAIN CATCHALL ROUTE --------------- 
// SEND USERS TO FRONTEND ------------
// has to be registered after API ROUTES
app.get('*', function(req, res)
{
	res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

process.on("uncaughtException", function (err)
{
	// we're just executing the default behavior
	// but you can implement your own custom logic here instead
	console.error(err);
	logger.error("uncaughtException:"+err);	
	//openshift-3 & -Registration temporarily unavailable!-
	//console.trace();
	//process.exit(-13);	//trust pm2 to restart!
});

// START THE SERVER
// ====================================
var server = app.listen(config.port, config.ipaddress);

ws.doio(server, logger);

console.log('PORT: ' + config.port);
