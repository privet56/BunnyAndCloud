
module.exports = (function(app, logger)
{
	var self = this;
	
	self.aDayInMs = 86400000;
	self.app = app;
	self.logger = logger;
	self.sessions = [];
	self.bRemoveInactiveUnknowns = false;

	self.log = function(s)
	{
		console.log(s);
		//if(self.logger)self.logger.error(s);
	};
	
	self.thereIsAnotherActiveSessionOfTheUser = function(session2skip)
	{
		for(var i=0;i<self.sessions.length;i++)
		{
			var session = self.sessions[i];
			if (session == session2skip)continue;
			if((session.state == "active") && (session.username == session2skip.username))return true;
		}
		return false;
	};
	
	self.cleanup = function(socket, data)
	{
		var i=0;
		var sessions2remove = [];
		for(i=0;i<self.sessions.length;i++)
		{
			var session = self.sessions[i];
			if(!session.state)
			{
				self.log("ws ... !state? "+session);
				continue;
			}
			if (session.state == "active")continue;
			
			if(!session.timestamp)
			{
				self.log("ws ... !timestamp?");
				sessions2remove.push(i);
				continue;
			}
			
			if(!session.username)self.log("ws ... !username?");
			
			var bForceDel = false;
			
			if(session.username == "unknown")		//remove inactive unknowns?
			{
				if(self.bRemoveInactiveUnknowns || self.sessions.length > 33)
				{
					bForceDel = true;
				}
			}
			else if(self.thereIsAnotherActiveSessionOfTheUser(session))
			{
				bForceDel = true;
			}
			
			//remove too old or other inactive connection of the same user
			if((((new Date().getTime()) - self.aDayInMs) > session.timestamp) ||
			   ((session.username == data.username) && (session.username != "unknown")) ||
				bForceDel)
			{
				sessions2remove.push(i);
			}
		}
		for(i = sessions2remove.length-1;i>-1;i--)
		{
			self.sessions.splice(sessions2remove[i], 1);
		}
		//self.log("ws: "+sessions2remove.length+" sessions removed --> "+self.sessions.length+" sessions remaining.");				//TODO: remove
	};
	
	self.doio = function(app, logger)
	{
		self.app = app;
		self.logger = logger;		
		self.io = require('socket.io').listen(app);

		self.io.on('connection', function(socket)
		{
			var connectiondata = null;
			  
			socket.on('disconnect', function()
			{
				if(connectiondata)connectiondata.state  = "disconnected";
				io.emit('userslist', JSON.stringify(self.sessions));
			});
			  
			socket.on('user', function(data)
			{
				data = JSON.parse(data);
				cleanup(socket, data);
				
				data.state 		= "active";
				data.timestamp 	= (new Date()).getTime();
				if(!data.id) self.log('onUser ... !id');
				connectiondata 	= data;
				
				{
					/*{"host":"localhost"
					"connection":"keep-alive"
					"user-agent":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36"
					"accept":"* / *"
					"referer":"http://localhost/login"
					"accept-encoding":"gzip, deflate sdch"
					"accept-language":"de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4"}
					*/
					//connectiondata.nspName 			= socket.nsp.name;			/					
					connectiondata.requestheaders 	= socket.request.headers;
					connectiondata.remoteAddress 	= socket.conn.remoteAddress;
				}
				
				self.set(data);
				
				//self.sessions.sort(function(a, b){return b.timestamp - a.timestamp;});
				
				io.emit('userslist', JSON.stringify(self.sessions));
			});
		});
	};
	
	self.set = function(data)
	{
		for(var i=0;i<self.sessions.length;i++)
		{
			if(data.id == self.sessions[i].id)
			{
				self.sessions[i] = data;
				return;
			}
		}
		self.sessions.push(data);
	};
	
	return this;
});
