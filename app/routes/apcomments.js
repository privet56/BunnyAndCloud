var bodyParser = require('body-parser');
var User       = require('../models/user');
var Comment    = require('../models/comment');
var jwt        = require('jsonwebtoken');
var config     = require('../../config');
var logger 	   = require("../logger");

module.exports = function()
{
  var self = this;
  
	self.get = function(req, res)
	{
		Comment.find().sort({ date : -1}).exec(function(err, dbcomments)
		{
			if (err) res.send(err);
			res.json(dbcomments);
		});
	};
	
	self.post = function(req, res)
	{
		var c = new Comment();

		if(!req.body.text)
			logger.error("!comment.text");

		c.username = req.body.username;
		c.text = req.body.text;

		c.save(function(err)
		{
			if (err)
			{
				return res.send(err);
			}

			res.json({ message: "Comment created!"});
		});
	};
	
	self.delete = function(req, res)
	{
		if(!req.params.id)
			logger.error("!comment.id");
		
		Comment.remove(
		{
			_id: req.params.id
		},
		function(err, user)
		{
			if (err) res.send(err);
			res.json({ message: 'Successfully deleted' });
		});
	};
	
	return self;
};
