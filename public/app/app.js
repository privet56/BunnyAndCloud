angular.module('userApp',
	[	'ngAnimate', 'treeControl', 'nvd3', 'app.routes', 'authService', 'mainCtrl', 'userCtrl',
		'bunnyCtrl', 'bunnymapCtrl', 'bunnygameCtrl', 'bunny3dCtrl',
		'commentsCtrl', 'asciiCtrl', 'healthCtrl', 'userService',
		'healthService', 'commentService', 'bHeader'])

// application configuration to integrate token into requests
.config(function($httpProvider)
{
	$httpProvider.interceptors.push('AuthInterceptor');		// attach our auth interceptor to the http requests
});

jQuery(document).ready(function()
{
	
});
