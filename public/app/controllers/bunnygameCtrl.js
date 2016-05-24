angular.module('bunnygameCtrl', ['userService', 'authService'])

.controller('bunnygameController', function(User, $rootScope, $scope, $location, Auth)
{
	var self = this;
	self.data = {};
	self.data.user = null;
	
	Auth.getUser().then(function(data)
	{
		self.data.user = data.data;
	});
	
	$scope.onGamePlayingStarted = function()
	{
		self.data.user.username = $.trim(self.data.user.username);
		
		if(!self.data.user.username || (self.data.user.username == null) || (self.data.user.username == ""))
		{
			console.log("Error setting LastPayed... no user.username");
			console.log(self.data.user);
			console.log(self.data.user.username);
			return;
		}
		
		User.updateLastPlayed(self.data.user.username, { lastplay: (new Date()).getTime() } ).success(function(data)
		{
			console.log("LastPayed successfully set. "+data);
			console.log(data.message);
		})
		.error(function(xhr, statusmsg, err)
		{
			console.log("Error at setting lastPayed, "+statusmsg+" "+err);
		});
		
		return false;
	};
	
   /*$rootScope.$on("$routeChangeStart", function(event, next, current)
   {
	   //if(next.templateUrl == "partials/login.html")
	   console.log("bunnygameController - $routeChangeStart next:"+next.templateUrl);
   });*/
});
