angular.module('commentsCtrl', ['commentService', 'authService'])

.controller('commentsController', function(Comment, Auth)
{
	var self = this;
	self.data = {};
	
	self.data.lastError = null;
	
	self.data.comment = '';
	self.data.comments = null;
	self.data.username = '';
	
	Auth.getUser().then(function(data)
	{
		self.data.username = data.data.username;
	});	
	
	self.isempty = function(s)
	{
		return ($.trim(s) == '');
	};
	
	self.canDel = function(comment)
	{
		if(self.isempty(self.data.username))return false;
		if(self.data.username == 'bunny')	return true;		//admin can del everything
		if(self.isempty(comment.username))	return true;		//I'm logged in and there is a comment without name -> I can del!
		
		if(comment.username == self.data.username)return true;	//I can del my own comments
		return false;
	};
	
	self.save = function()
	{
		self.lastError = "";
		
		if($.trim(self.data.comment) == '')
		{
			self.data.lastError = "empty comment"; 
			return;
		}
		
		self.processing = true;

		Comment.create({ username:self.data.username, text:self.data.comment, date:(new Date()).getTime() }).success(function(data)
		{
			Comment.all().success(function(data)
			{
				self.processing = false;
				self.data.comments = data;
				self.data.comment = "";
				self.data.lastError = "New comment saved.";
			})
			.error(function(xhr, statusmsg, err)
			{
				self.processing = false;
				self.lastError = "Error at listing the comments, "+statusmsg+" "+err;
			});
		})
		.error(function(xhr, statusmsg, err)
		{
			self.processing = false;
			self.lastError = "Error at creating the comment, "+statusmsg+" "+err;
		});	
	};
	
	self.processing = true;	// set a processing variable to show loading things

	Comment.all().success(function(data)
	{
		self.processing = false;
		self.data.comments = data;
	})
	.error(function(xhr, statusmsg, err)
	{
		self.processing = false;
		self.lastError = "Error at listing the comments, "+statusmsg+" "+err;
	});

	self.del = function(id)
	{
		self.lastError = "";
		
		if(!id)
		{
			self.data.lastError = "empty id"; 
			return;
		}

		self.processing = true;

		Comment.delete(id).success(function(data)
		{
			Comment.all().success(function(data)
			{
				self.processing = false;
				self.data.comments = data;
			})
			.error(function(xhr, statusmsg, err)
			{
				self.processing = false;
				self.lastError = "Error at listing the comments, "+statusmsg+" "+err;
			});
		})
		.error(function(xhr, statusmsg, err)
		{
			self.processing = false;
			self.lastError = "Error at deleting the comment, "+statusmsg+" "+err;
		});
	};
});
