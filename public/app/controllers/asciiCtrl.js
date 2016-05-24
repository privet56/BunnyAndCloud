angular.module('asciiCtrl', ['authService'])

.controller('asciiController', function($scope, $window, $timeout, Auth)
{
	var self = this;

	self.processing = false;
	self.data = {};
	self.data.lastError = null;
	self.data.asciis = [];
	
	self.align = function(pxl/*0-255*/)
	{
		pxl = Math.round(pxl / 17);
		return pxl * 17;
	};
	self.getChar4GrayPixel = function(pxl/*0-255*/, i, widthFactor)
	{
		var chars = "_.~:,=?I+7$8ZODNM";	//17 chars, 17 * 15 = 255
		pxl = Math.floor((((255 - pxl) / 15)));
		var c = chars[pxl];
		if(c === undefined)
			c = chars[0];
		return c + c;
	};
	self.doascii = function(img, canvasHeight, idPostFix, ascii, asciisIndex)
	{
    	var canvas = document.getElementById("canvasascii"+idPostFix);
        var widthFactor = img.width / img.height;
        canvas.width  = Math.floor(canvasHeight * widthFactor);
        canvas.height = canvasHeight;

        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
		ctx.mozImageSmoothingEnabled = true;
		ctx.webkitImageSmoothingEnabled = true;
		ctx.msImageSmoothingEnabled = true;

        ctx.drawImage(img, 0, 0, img.width, img.height);
        var imageData = ctx.getImageData(0, 0, img.width, img.height);
        var data  = imageData.data;
       	var sAscii = "";
		var sAscii4Colors = "";
		var sAscii4Colors_lastColor = "";
       	var iBreak = Math.floor(data.length / canvasHeight);
       	
        for (var i = 0; i < data.length; i += 4/*RGBA*/)
        {
        	var avg = (data[i]/*R*/ + data[i+1]/*G*/ + data[i+2]/*B*/) / 3;
        	var newChars = self.getChar4GrayPixel(avg, i, widthFactor);
			sAscii += newChars;
			if(newChars === '__')
			{
				var sAscii4ColorsColor = "";
				if (sAscii4ColorsColor === sAscii4Colors_lastColor)
					sAscii4Colors += newChars;
				else
					sAscii4Colors += "</span>" + newChars;								
				sAscii4Colors_lastColor = "";
			}
			else
			{
				var sAscii4ColorsColor = "<span style='color:rgb("+self.align(data[i])+","+self.align(data[i+1])+","+self.align(data[i+2])+");'>";
				if (sAscii4ColorsColor === sAscii4Colors_lastColor)
					sAscii4Colors += newChars;
				else
					sAscii4Colors += (sAscii4Colors_lastColor === "" ? "" : "</span>") + sAscii4ColorsColor + newChars;
				
				sAscii4Colors_lastColor = sAscii4ColorsColor;
			}
        	if((i % iBreak) == 0)
        	{
        		sAscii += "<br>";
				sAscii4Colors += (sAscii4Colors_lastColor === "" ? "" : "</span>")+"<br>";
        	}
        }
        sAscii4Colors += (sAscii4Colors_lastColor === "" ? "" : "</span>");
        sAscii = sAscii.replace(/_/gi, "&nbsp;");
		sAscii4Colors = sAscii4Colors.replace(/_/gi, "&nbsp;");
		
		ascii["canvas_data"	+idPostFix] = data;
		ascii["ascii"		+idPostFix] = sAscii;
		ascii["ascii4Colors"+idPostFix] = sAscii4Colors;
		ascii["imageData"	+idPostFix] = imageData;
		ascii["img.width"	+idPostFix] = img.width;
		ascii["img.height"	+idPostFix] = img.height;
		
		$timeout(function(){self.fillNewRow(ascii);}, 500);
	};
	
	self.data.aDemoFiles = ["assets/img/android.png", "assets/img/bunny.png", "assets/img/ascii.png", "assets/img/qt.png", "assets/img/win32.png"];
	$timeout(function(){self.fillDemo(1);}, 1500);
	
	self.fillDemo = function(i)
	{
    	self.onfileWithResult(null, self.data.aDemoFiles.pop());
    	if(self.data.aDemoFiles.length > 0)
    		$timeout(function(){self.fillDemo(1+i);}, 1500);
	};
	
	self.fillNewRow = function(ascii)
	{
		var canvas 		= $window.document.getElementById("canvasascii_low"		 +ascii["id"]);
		var high 		= $window.document.getElementById("fontascii"			 +ascii["id"]);
		var low 		= $window.document.getElementById("fontascii_low"		 +ascii["id"]);
		var low_colored = $window.document.getElementById("fontascii_low_colored"+ascii["id"]);
		
		if(!high)
		{
			console.log("asciiCtrl:fillNewRow: elenf: "+ascii["id"]);
			return;
		}

		high.innerHTML 			= ascii["ascii"];
		low.innerHTML 			= ascii["ascii_low"];
		low_colored.innerHTML 	= ascii["ascii4Colors_low"];
		
		{
	        var ctx = canvas.getContext('2d');
	        ctx.imageSmoothingEnabled = true;
			ctx.mozImageSmoothingEnabled = true;
			ctx.webkitImageSmoothingEnabled = true;
			ctx.msImageSmoothingEnabled = true;
	        ctx.putImageData(ascii["imageData_low"], 0,0);//ascii["img.width_low"], ascii["img.height_low"]);
       }
	};
	
	self.appendNewAscii = function(ascii)
	{
		ascii["isinasciis"] = true;
		ascii["id"] = ""+((new Date()).getTime());
		self.data.asciis.unshift(ascii);
		for(var i=0;i<self.data.asciis.length;i++)
		{
			self.data.asciis[i]["index"] = self.data.asciis[i]["idx"] = i;
		}
	};
	
	self.onfileWithResult = function(eventTargetResult, src)
	{
    	var ascii = {};
    	var asciisLen = self.data.asciis.length;
    	self.appendNewAscii(ascii);
    	
    	{
	        var img_low = $window.document.getElementById("imgascii_low");
	        img_low.onerror = function()
	        {
				$scope.$apply(function()
				{
					self.data.asciis.shift();
					self.data.lastError = "File format not supported.";
				});
			};
	        img_low.onload = function()
	        {
	        	self.doascii(img_low, 33, "_low", ascii, asciisLen);
	        	self.processing = false;
	        };
	        img_low.src = eventTargetResult ? eventTargetResult : src;
       	}
        {
	        var img = $window.document.getElementById("imgascii");
	        img.onload = function()
	        {
	        	self.doascii(img, 199, "", ascii, asciisLen);
	        	self.processing = false;
	        };
	        img.src = eventTargetResult ? eventTargetResult : src;
        }		
	};

	self.onfile = function(inputid)
	{
		self.processing = true;
		self.data.lastError = null;
	    var reader = new FileReader();
	    reader.onload = function(event)
	    {
	    	self.onfileWithResult(event.target.result);
	    };
	    reader.readAsDataURL($window.document.getElementById(inputid).files[0]);
	};
	self.show = function(ascii, idx)
	{
		var c = null;
		if(idx == 0)
			c = ascii["ascii"];
		else if(idx == 1)
			c = ascii["ascii_low"];
		else if(idx == 2)
			c = ascii["ascii4Colors_low"];
		else
		{
			console.log("unknown idx:"+idx);
			c = ascii["ascii"];
		}
			
		var newWin = open('about:blank','window','');
		newWin.document.write('<font color="000000" size="3" face="monospace, Courier" id="fontascii" style="font-size:'+(idx == 0 ? 6 : 12)+'px;white-space:nowrap;">'+c+'</font>');
		newWin.document.close();
		return false;
	};
});
