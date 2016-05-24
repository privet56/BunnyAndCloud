angular.module('healthService', [])

.factory('Health', function($http)
{
	var healthFactory = {};		// create a new object

	// get health json data
	healthFactory.all = function()
	{
		return $http.get('/api/health/?'+((new Date()).getTime()));
	};

	return healthFactory;		// return our entire factory object
});
