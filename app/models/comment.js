var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var CommentSchema   = new Schema({
	username: { type: String, required: false},
	text: { type: String, required: false },
	date: { type: Number, required: false }
});

CommentSchema.pre('save', function(next)
{
	var comment = this;
	if(!comment.date)
		comment.date = (new Date()).getTime();
	next();
});

module.exports = mongoose.model('Comment', CommentSchema);
