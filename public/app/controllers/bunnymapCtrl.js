angular.module('bunnymapCtrl', [])

.controller('bunnymapController', function()
{
	var self = this;
	self.data = {};

	self.data.addKeywordValue = "";
	self.data.keywords = ["bunny", "rabbit", "hase"];
	
	self.delKeyword = function(idx, kw)
	{
		self.data.keywords.splice(idx, 1);
		self.onKeywordsChange();
	};
	
	self.addKeyword = function()
	{
		self.data.addKeywordValue = $.trim(self.data.addKeywordValue).toLowerCase();
		
		for(var i=0;i<self.data.keywords.length;i++)
		{
			if(self.data.addKeywordValue == self.data.keywords[i])return;
		}
		
		self.data.keywords.unshift(self.data.addKeywordValue);
		self.data.addKeywordValue = "";
		self.onKeywordsChange();
	};
	
	self.onKeywordsChange = function()
	{
		  var tags = self.data.keywords.join(' ').split(' ').join(',');
		  loadFlickrFeed(tags);		
	};
	
	self.onKeywordsChange();
});
