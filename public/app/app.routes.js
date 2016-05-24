angular.module('app.routes', ['ngRoute'])

.config(function($routeProvider, $locationProvider)
{
	$routeProvider

		// route for the home page
		.when('/', {
			templateUrl : 'app/views/pages/home.html'
		})
		
		// login page
		.when('/login', {
			templateUrl : 'app/views/pages/login.html',
   			controller  : 'mainController',
    			controllerAs: 'login'
		})
		
		// show all users
		.when('/users', {
			templateUrl: 'app/views/pages/users/all.html',
			controller: 'userController',
			controllerAs: 'user'
		})
		
		// native
		.when('/native', {
			templateUrl: 'app/views/pages/native.html',
			controller: 'bunnyController',
			controllerAs: 'bunny'
		})

		// bunny carousel
		.when('/bunnycarousel', {
			templateUrl: 'app/views/pages/bunny/bunnycarousel.html',
			controller: 'bunnyController',
			controllerAs: 'bunny'
		})
		
		// bunny book
		.when('/bunnybook', {
			templateUrl: 'app/views/pages/bunny/bunnybook.html',
			controller: 'bunnyController',
			controllerAs: 'bunny'
		})
		// bunny 2D Adventure
		.when('/bunnytwodadv', {
			templateUrl: 'app/views/pages/bunny/bunny2d.html',
			controller: 'bunnyController',
			controllerAs: 'bunny'
		})
		
		// bunny map
		.when('/bunnymap', {
			templateUrl: 'app/views/pages/bunny/bunnymap.html',
			controller: 'bunnymapController',
			controllerAs: 'bunnymap'
		})
		
		// bunny 3d
		.when('/bunny3d', {
			templateUrl: 'app/views/pages/bunny/bunny3d.html',
			controller: 'bunny3dController',
			controllerAs: 'bunny3d'
		})
		// bunny 3d explorer
		.when('/bunny3dexplorer', {
			templateUrl: 'app/views/pages/bunny/bunny3dexplorer.html',
			controller: 'bunnyController',
			controllerAs: 'bunny'
		})		
		// bunny game
		.when('/bunnygame', {
			templateUrl: 'app/views/pages/bunny/bunnygame.html',
			controller: 'bunnygameController',
			controllerAs: 'bunnygame'
		})

		// show bunnies
		.when('/bunny', {
			templateUrl: 'app/views/pages/bunny/bunny.html',
			controller: 'bunnyController',
			controllerAs: 'bunny'
		})

		// show comments
		.when('/comments', {
			templateUrl: 'app/views/pages/comments.html',
			controller: 'commentsController',
			controllerAs: 'comments'
		})
		
		// ascii
		.when('/ascii', {
			templateUrl: 'app/views/pages/ascii.html',
			controller: 'asciiController',
			controllerAs: 'ascii'
		})
		
		.when('/health', {													// show health
			templateUrl: 'app/views/pages/health.html',
			controller: 'healthController',
			controllerAs: 'health'
		})
		
		// show community
		.when('/community', {
			templateUrl: 'app/views/pages/community.html',
			controller: 'bunnyController',
			controllerAs: 'bunny'
		})

		// show bunny links
		.when('/bunnylinks', {
			templateUrl: 'app/views/pages/bunny/bunnylinks.html',
		})

		// form to create a new user
		// same view as edit page
		.when('/users/create', {
			templateUrl: 'app/views/pages/users/single.html',
			controller: 'userCreateController',
			controllerAs: 'user'
		})

		// page to edit a user
		.when('/users/:user_id', {
			templateUrl: 'app/views/pages/users/single.html',
			controller: 'userEditController',
			controllerAs: 'user'
		});

		$locationProvider.html5Mode(true);//false).hashPrefix('!');
})
.run( function($rootScope, $location)
{
   /*$rootScope.$on("$routeChangeStart", function(event, next, current)
   {
	   //if(!next.bunnygame) -> hide iframe
	   
	   if(next.templateUrl != 'app/views/pages/bunny/bunnygame.html')
	   {
		   console.log("app.routes - $routeChangeStart next:"+next.templateUrl+" --> hide iframe");
		   $("#gameiframe").offset($("#div_gameiframe").offset()).hide();
	   }
   });
   $rootScope.$on("$routeChangeSuccess", function(event, next, current)
   {
	   if(!current || !current.templateUrl)return;
	   
	   //if(current.bunnygame) -> show iframe
	   
	   if(next.templateUrl == 'app/views/pages/bunny/bunnygame.html')
	   {
		   console.log("app.routes - $routeChangeSuccess cur:"+current.templateUrl+" --> show iframe");
		   $("#gameiframe").offset($("#div_gameiframe").offset()).show();
	   }
   });*/
});
