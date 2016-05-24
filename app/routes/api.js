var bodyParser = require('body-parser'); 	// get body-parser
var User       = require('../models/user');
var jwt        = require('jsonwebtoken');
var config     = require('../../config');
var logger 	   = require("../logger");
var api_comments = require("./apcomments");
var api_health = require("./aphealth");

// super secret for creating tokens
var superSecret = config.secret;

module.exports = function(app, express)
{
	var apiRouter = express.Router();

	// route to generate sample user
	apiRouter.post('/sample', function(req, res)
    {
		// look for the user named bunny
		User.findOne({ 'username': 'bunny' }, function(err, user)
		{
			// if there is no bunny user, create one
			if (!user)
			{
				var sampleUser = new User();

				sampleUser.name = 'bunny';  
				sampleUser.username = 'bunny'; 
				sampleUser.password = 'softcon';

				sampleUser.save();
			}
			else
			{
				console.log(user);
				// if there is a bunny, update his password
				user.password = 'softcon';
				user.save();
			}
		});
	});
	
	apiRouter.route('/userlastplayed/:username')
		.put(function(req, res)
		{
			if(!req.body.lastplay)
			{
		        res.status(405).send({ 
		        	success: false, 
		        	message: 'Wrong request.'
		    	});
				return;
			}
			
			User.findOne({'username':req.params.username}, function(err, user)
			{
				if (err)
				{
					logger.error("!userlastplayed for user '"+req.params.user_id+"'");
					res.send(err);
				}
				
				user.lastplay = req.body.lastplay;

				user.save(function(err)
				{
					if (err)
					{
						logger.error("!userlastplayed !save for user '"+req.params.user_id+"'");
						res.send(err);
					}
					res.json({ message: 'User lastplay updated!' });
				});
			});
		});

	
	apiRouter.route('/comments')
		.post(function(req, res)
		{
			api_comments().post(req, res);
		})
		.delete(function(req, res)
		{
			api_comments().delete(req, res);
		})
		.get(function(req, res)
		{
			api_comments().get(req, res);
		});
	apiRouter.route('/comments/:id')
		.delete(function(req, res)
		{
			api_comments().delete(req, res);
		});
		
	apiRouter.get('/health', function(req, res)
	{
	  api_health().get(req, res);
	});

	// route to authenticate a user (POST http://localhost:8080/api/authenticate)
	apiRouter.post('/authenticate', function(req, res)
	{
	  // find the user
	  User.findOne({
	    username: req.body.username
	  }).select('name username password').exec(function(err, user)
	  {
	    if (err) throw err;

	    // no user with that username was found
	    if (!user)
	    {
	      logger.error("Authentication failed. User not found. name:"+req.body.username+" type:"+req.body.type);
	      res.json({ 
	      	success: false, 
	      	message: 'Authentication failed. User not found.' 
	    	});
	    }
	    else if (user)
	    {
	      // check if password matches
	      var validPassword = user.comparePassword(req.body.password);
	      if(!validPassword)
	      {
	    	logger.error("Authentication failed. Wrong password. name:"+req.body.username+" type:"+req.body.type);
	        res.json({ 
	        	success: false, 
	        	message: 'Authentication failed. Wrong password.' 
	      	});
	      }
	      else
	      {
	        // if user is found and password is right
	        // create a token
	        var token = jwt.sign({
	        	name: user.name,
	        	username: user.username
	        }, superSecret, {
	          expiresInMinutes: 1440 // expires in 24 hours
	        });

	        logger.error("Authentication ok. name:"+req.body.username+" type:"+req.body.type+" token:"+token);
	        // return the information including token as JSON
	        res.json({
	          success: true,
	          message: 'Enjoy your token!',
	          token: token
	        });
	      }
	    }
	  });
	});

	// route middleware to verify a token
	apiRouter.use(function(req, res, next)
	{
	  // check header or url parameters or post parameters for token
	  var token = req.body.token || req.query.token || req.headers['x-access-token'];
	  
	  // decode token
	  if (token)
	  {
	    // verifies secret and checks exp
	    jwt.verify(token, superSecret, function(err, decoded)
	    {
	      if (err)
	      {
	    	logger.error('Failed to authenticate token token:'+token+" name:"+req.body.name+" type:"+req.body.type+"\nerr:"+err);
	        res.status(403).send({ 
	        	success: false, 
	        	message: 'Failed to authenticate token.' 
	    	});  	   
	      }
	      else
	      {
	        // if everything is good, save to request for use in other routes
	        req.decoded = decoded;
	        next(); // make sure we go to the next routes and don't stop here
	      }
	    });
	  }
	  else
	  {
		logger.error('No token provided. token:'+token+" name:"+req.body.name+" type:"+req.body.type);
	    // if there is no token
	    // return an HTTP response of 403 (access forbidden) and an error message
		
		if(req.body.name && req.body.username && req.body.password && req.body.type == "create")
		{
			req.register = true;
			next(); // make sure we go to the next routes and don't stop here
			return;
		}
		logger.error("req:"+req.url+" -> no token -> 403");
   	 	res.status(403).send({
   	 		success: false, 
   	 		message: 'No token provided.' 
   	 	});
	  }
	});

	// test route to make sure everything is working 
	// accessed at GET http://localhost:8080/api
	apiRouter.get('/', function(req, res)
	{
		res.json({ message: 'hooray! welcome to our api!' });	
	});

	// on routes that end in /users
	// ----------------------------------------------------
	apiRouter.route('/users')

		// create a user (accessed at POST http://localhost:8080/users)
		.post(function(req, res)
		{
			var user = new User();		// create a new instance of the User model
			user.name = req.body.name;  // set the users name (comes from the request)
			user.username = req.body.username;  // set the users username (comes from the request)
			user.password = req.body.password;  // set the users password (comes from the request)
			
			if(user.name && user.username && ((user.name.toLowerCase().indexOf("test") == 0) || (user.username.toLowerCase().indexOf("test") == 0)))
			{
				return res.json({ success: false, message: 'Please do not use test username.'});
			}

			user.save(function(err)
			{
				if (err)
				{
					// duplicate entry
					if (err.code == 11000) 
						return res.json({ success: false, message: 'A user with that username already exists. '});
					else 
						return res.send(err);
				}

				// return a message
				res.json({ message: 'User created! ' + (!req.register ? "" : " You can now log in!") });
			});

		})

		// get all the users (accessed at GET http://localhost:8080/api/users)
		.get(function(req, res) {

			User.find({}, function(err, users) {
				if (err) res.send(err);

				// return the users
				res.json(users);
			});
		});

	// on routes that end in /users/:user_id
	// ----------------------------------------------------
	apiRouter.route('/users/:user_id')

		// get the user with that id
		.get(function(req, res) {
			User.findById(req.params.user_id, function(err, user) {
				if (err) res.send(err);

				// return that user
				res.json(user);
			});
		})

		// update the user with this id
		.put(function(req, res) {
			User.findById(req.params.user_id, function(err, user) {

				if (err) res.send(err);

				// set the new user information if it exists in the request
				if (req.body.name) user.name = req.body.name;
				if (req.body.username) user.username = req.body.username;
				if (req.body.password) user.password = req.body.password;

				// save the user
				user.save(function(err) {
					if (err) res.send(err);

					// return a message
					res.json({ message: 'User updated!' });
				});

			});
		})

		// delete the user with this id
		.delete(function(req, res)
		{
			User.remove({
				_id: req.params.user_id
			}, function(err, user)
			{
				if (err) res.send(err);
				res.json({ message: 'Successfully deleted' });
			});
		});

	// api endpoint to get user information
	apiRouter.get('/me', function(req, res)
	{
		res.send(req.decoded);
	});

	return apiRouter;
};