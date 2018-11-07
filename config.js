module.exports = {
	'ipaddress': process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
	'port'     : process.env.PORT || (process.env.OPENSHIFT_NODEJS_PORT || 8080),
	'database': 'mongodb://myusername:mypwd@apollo.modulusmongo.net:27017/mydb',
	'secret': 'mysecret'
};

// TODO: requestFullScreen
// TODO: impl interceptor in Router and check login state
// TODO: tree in navigator
// TODO: !html5.hashPrefix('!'); + change links (prefix !#
// TODO: logout -> clean up user info on the client
// TODO: use fs to list the bunny pics
// TODO: use bunnyService for pic list
// TODO: login with facebook
// TODO: last login for users
// TODO: use $http.default.headers[Authentication] = 'Basic' + token
// TODO: impl build/minimize js
