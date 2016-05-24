angular.module('bHeader', [])

.directive('bHeader', function ()
{
	return {
		restrict:'E',
		templateUrl:'app/views/pages/header.html',
		link: function (scope, elm, attr)
		{
			scope.title = attr['title'];
		}
	};
});
