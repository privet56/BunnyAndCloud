angular.module('mainCtrl', ['ngAnimate'])

.controller('mainController', function($rootScope, $location, Auth)
{
	var vm = this;

	$rootScope.bunnywebSocket_id = $rootScope.bunnywebSocket_id ? $rootScope.bunnywebSocket_id : "id_"+(new Date()).getTime();
	vm.bunnywebSocket = null;
	vm.bunnywebSocketMessage = null;
	vm.mybunnywebSocketMessage = null;
	vm.loggedIn = Auth.isLoggedIn();	// get info if a person is logged in

	$rootScope.$on('$routeChangeStart', function()		// check to see if a user is logged in on every request
	{
		vm.loggedIn = Auth.isLoggedIn();	

		Auth.getUser().then(							// get user information on page load
			function(data)
			{
				vm.user = data.data;
				setTimeout(function() {vm.onWebSiteLoaded();}, 3000);
			},
			function(data)
			{
				setTimeout(function() {vm.onWebSiteLoaded();}, 3000);
			});
	});	

	vm.doLogin = function()		// function to handle login form
	{
		vm.processing = true;
		vm.error = '';			// clear the error

		Auth.login(vm.loginData.username, vm.loginData.password)
		.success(function(data)
		{
			vm.processing = false;

			if (data.success)		// if a user successfully logs in, redirect to home page
			{
				if(!vm.user)
					vm.user = {};
				vm.user.username = vm.loginData.username;
				setTimeout(function() {vm.onWebSiteLoaded();}, 3000);
				$location.path('/');
			}
			else
			{
				vm.error = data.message;
			}
		})
		.error(function(xhr, statusmsg, err)
		{
			vm.processing = false;
			vm.error = statusmsg+" "+err;
		});	
	};
	
	vm.canEditUser = function(person)
	{
		if(!vm.loggedIn)return false;
		if(vm.user.username == 'bunny')return true;
		if(vm.user.username == person.username)return true;
		return false;
	};
	
	vm.canDelUser = function(person)
	{
		if(!vm.loggedIn)return false;
		if(vm.user.username == 'bunny')return true;
		return false;		
	};

	vm.doLogout = function()		// function to handle logging out
	{
		Auth.logout();
		vm.user = '';
		setTimeout(function() {vm.onWebSiteLoaded();}, 3000);
		$location.path('/login');
	};

	vm.createSample = function()
	{
		Auth.createSampleUser();
	};
	
	vm.doInfo = function()
	{
	    BootstrapDialog.show({
	    	title: "Info",
	    	//TODO: $('<div></div>').load('remote.html')
	    	message: "<p><strong>Bunny Portal</strong></p><p>Technologies: MEAN (MongoDB, Express, AngularJS, NodeJS) and Bootstrap.</p><p> The name 'Bunny And Cloud' is inspired by '<a href='http://en.wikipedia.org/wiki/Bonnie_and_Clyde' target='_blank'>Bonnie and Clyde</a>'.",
    		buttons: [{
                label: 'Close',
                action: function(dialogItself){
                    dialogItself.close();
                }
            }]
	    });
		return false;
	};
	
	vm.onWebSiteLoaded = function()
	{
		if(!vm.bunnywebSocket)
		{
			vm.bunnywebSocket = io();
			vm.bunnywebSocket.on('connect', function ()
			{
				vm.bunnywebSocket.emit('user', JSON.stringify(vm.getMyBunnyWebSocketMessage()));
				console.log("on-connect emitted. ");
			});			
			vm.bunnywebSocket.on('error', function (data)			//no special handling needed, as the lib tries to reconnect		//error, disconnect
			{
				console.log("on-error");
			});
			vm.bunnywebSocket.on('userslist', function (data)
			{
				data = JSON.parse(data);
				vm.bunnywebSocketMessage = data;
				$rootScope.$apply();					//todo: check if $apply(function(){vm.bunnywebSocketMessage = evt.data;}); would be better
			});
			
			return;
		}	//end if(!vm.bunnywebSocket)
		
		{
			if(JSON.stringify(vm.mybunnywebSocketMessage) != JSON.stringify(vm.getMyBunnyWebSocketMessage()))
			{
				vm.bunnywebSocket.emit('user', JSON.stringify(vm.getMyBunnyWebSocketMessage()));
			}
		}
	};
	
	vm.getMyBunnyWebSocketMessage = function(force)
	{
		var username = vm.user && vm.user.username ? vm.user.username : "unknown";
		
		var lastSentUserName = vm.mybunnywebSocketMessage ? vm.mybunnywebSocketMessage.username : null;
		
		if(lastSentUserName != username)
			force = true;
		
		if(!force && vm.mybunnywebSocketMessage)return vm.mybunnywebSocketMessage;
		
		var naviAttributes2Send = ['vendor', 'appVersion', 'platform', 'userAgent', 'languages', 'oscpu', 'appName'];
		var o = {};
		{
			o["timestamp"] 	= (new Date()).getTime();
			o["state"] 		= "active";
			o["username"] 	= username;

			for(var i=0;i<naviAttributes2Send.length;i++)
			{
				if(!window.navigator[naviAttributes2Send[i]] || ($.trim(window.navigator[naviAttributes2Send[i]]) == ""))continue;
				o[naviAttributes2Send[i]] = window.navigator[naviAttributes2Send[i]];
			}
		}
		o["id"] = $rootScope.bunnywebSocket_id;
		vm.mybunnywebSocketMessage = o;
		return vm.mybunnywebSocketMessage;
	};	
});
