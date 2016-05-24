angular.module('commentService', [])

.factory('Comment', function($http) {

	// create a new object
	var commentFactory = {};

	// get all comments
	commentFactory.all = function() {
		return $http.get('/api/comments/');
	};

	// create a comment
	commentFactory.create = function(data) {
		return $http.post('/api/comments/', data);
	};

	// delete a comment
	commentFactory.delete = function(id) {
		return $http.delete('/api/comments/' + id);
	};

	// return our entire factory object
	return commentFactory;
});
