var path = require("path"),
winston = require("winston");

module.exports = new (winston.Logger)({
	transports: [
		//only logs errors to the console
		new (winston.transports.Console)({
			level: "error"
		}),
		//all logs will be saved to this app.log file
		new (winston.transports.File)({
			filename: path.resolve(__dirname, "../public/winston.app.log")
		}),
		/* only errors will be saved to errors.log, and we can examine
		// to app.log for more context and details if needed.
		new (winston.transports.File)({
			level: "error",
			filename: path.resolve(__dirname, "./winston.errors.log")
		})*/
	]
});
