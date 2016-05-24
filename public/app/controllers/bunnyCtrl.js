angular.module('bunnyCtrl', ['userService', 'infinite-scroll', 'angular-carousel'])

.controller('bunnyController', function(User)
{
	var self = this;
	self.data = {};
	
	self.getpics = function(len)
	{
		var a = new Array();
		for(var i=1;i<=len;i++)
		{
			var s = ""+i+"";
			while(s.length < 2) s = "0"+s;
			a.push(s);
		}
		return a;
	};

	self.data.themes = [
	        {
				name: "home",
				carouselIndex:0,
				_pics: self.getpics(12),
				pics: function()
				{
					return this._pics;
				}
			},
			{
				name: "winter",
				carouselIndex:0,
				_pics: self.getpics(7),
				pics: function()
				{
					return this._pics;
				}
			},
			{
				name: "autumn",
				carouselIndex:0,
				_pics: self.getpics(3),
				pics: function()
				{
					return this._pics;
				}
			},
			{
				name: "spring",
				carouselIndex:0,
				_pics: self.getpics(4),
				pics: function()
				{
					return this._pics;
				}
			},
			{
				name: "summer",
				carouselIndex:0,
				_pics: self.getpics(4),
				pics: function()
				{
					return this._pics;
				}
			}]
	;
	
	self.ongoto = function(aname)
	{
		//$(document.body).scrollTop($('#'+aname).offset().top);
		//document.getElementById(aname).scrollIntoView();
		return false;
	};
	
	self.data.infiniteImgs = new Array();
	self.data.iCurTheme = 0;
	
	self.infiniteImgsLoad = function()
	{
		if( self.data.iCurTheme >= self.data.themes.length)
		{
			self.data.iCurTheme = 0;
		}
		var aPicIndexes = self.data.themes[self.data.iCurTheme].pics();
		
		for(var i=0; i < aPicIndexes.length; i++)
		{
			self.data.infiniteImgs.push({theme:self.data.themes[self.data.iCurTheme].name, idx:aPicIndexes[i]});
		}		
		self.data.iCurTheme++;
	};
	self.infiniteImgsLoad();

	self.data.allImgs = null;
	self.allImgs = function()
	{
		if(self.data.allImgs) return self.data.allImgs;
		self.data.allImgs = new Array();
		for(var it=0;it<self.data.themes.length;it++)
		{
			var aPicIndexes = self.data.themes[it].pics();
			
			for(var i=0; i < aPicIndexes.length; i++)
			{
				self.data.allImgs.push({theme:self.data.themes[it].name, idx:aPicIndexes[i]});
			}		
		}
		return self.data.allImgs;
	};
});
