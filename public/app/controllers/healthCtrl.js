angular.module('healthCtrl', ['healthService', 'authService'])

.controller('healthController', function($scope, $interval, Health, Auth)
{
	var self = this;
	
	self.TYPE_OBJECT = 1; 
	self.TYPE_ARRAY = 2;
	self.TYPE_PRIMITIVE = 3;
	
	self.data = {};
	self.data.chart = {};
	
	self.data.lastError = null;
	self.data.health 	= null;
	self.data.expandedNodes = new Array();
	self.data.username 	= '';			//for later
	self.data.processing 	= false;	//set a processing variable to show loading things
	
	Auth.getUser().then(function(data)
	{
		self.data.username = data.data.username;
	});	
	
	self.isempty = function(s)
	{
		return ($.trim(s) == '');
	};
	
	self.fillHealthData = function()
	{
		self.data.processing = true;
		self.data.lastError = null;
		
		Health.all().success(function(data)
		{
			var i=0;
			//data = JSON.parse(data.replace(/([\\,\\{\\[])(\w+):/g,"$1\"$2\":"));
			self.data.processing 	= false;
			if(!self.data.health)								//TODO: update complete tree!
			{
				self.data.health 		= data;//JSON.parse(data);//JSON.stringify(data);
				self.data.treedata.length = 0;			//not self.data.treedata = [];
				self.buildTreeData(self.data.health, self.data.treedata, 0, "root");
				{
					var r = self.data.treedata[0]["children"][0];
					self.data.expandedNodes.length = 0;
					self.data.expandedNodes.push(self.data.treedata[0]);
					self.data.expandedNodes.push(r);
				}
				
				for(i=0;i<self.data.health.length;i++)
				{
					self.data.chart.data.push({"key":"Memory usage on Node "+i	, "type":"line", "yAxis":1, "values":[]});
				}
				for(i=0;i<self.data.health.length;i++)
				{
					self.data.chart.data.push({"key":"CPU usage on Node "	+i	, "type":"bar", "yAxis":2, "values":[]});
				}
			}
			else
			{
				self.data.health = data;
				var root 	= self.data.treedata[0];
				var array1 	= root["children"][0];
				var monit 	= array1["children"][array1["children"].length - 1];
				var memory 	= monit["children"][0];
				memory["label_value"] = self.data.health[0]["monit"]["memory"];			//this is the only attribute I update currently...
			}

			for(i=0;i<self.data.health.length;i++)
			{
				var aMem = self.data.chart.data[i]["values"];
				aMem.push({x:(new Date()).getTime(), y:self.data.health[i]["monit"]["memory"]});
				while(aMem.length > 22)	aMem.shift();
			}
			for(i=0;i<self.data.health.length;i++)
			{
				var aCpu = self.data.chart.data[i + self.data.health.length]["values"];
				aCpu.push({x:(new Date()).getTime(), y:self.data.health[i]["monit"]["cpu"]});
				while(aCpu.length > 22)	aCpu.shift();
			}
			self.setMaxyDomains(self.data.chart.data, self.data.chart.options.chart); 
			$scope.api.refresh();
			//self.data.chart.options.chart.interactiveGuideline.tooltip.valueFormatter(function() {return "aa";});		//TODO:
		})
		.error(function(xhr, statusmsg, err)
		{
			self.data.processing = false;
			self.data.lastError = "Error at listing the comments, "+statusmsg+" "+err;
		});
	};
	
	self.setMaxyDomains = function(chartData, chartOptions)
	{
		var i=0;
		
		var minMem = 0;
		var maxMem = 512*1024*1024;			//OPENSHIFT_GEAR_MEMORY_MB, 512 MB
		var minCpu = 0;
		var maxCpu = 100;
		
		for(i=0;i<self.data.health.length;i++)
		{
			var aMem = self.data.chart.data[i]["values"];
			for(var j=0;j<aMem.length;j++)
			{
				if((i === 0) && (j === 0))
				{
					minMem = aMem[j]["y"];
					maxMem = aMem[j]["y"];
				}
				if(aMem[j]["y"] > maxMem)
					maxMem = aMem[j]["y"];
				if(aMem[j]["y"] < minMem)
					minMem = aMem[j]["y"];
			}
		}
		for(i=0;i<self.data.health.length;i++)
		{
			var aCpu = self.data.chart.data[i + self.data.health.length]["values"];
			for(var j=0;j<aCpu.length;j++)
			{
				if((i === 0) && (j === 0))
				{
					minCpu = aCpu[j]["y"];
					maxCpu = aCpu[j]["y"];
				}
				if(aCpu[j]["y"] > maxCpu)
					maxCpu = aCpu[j]["y"];
				if(aCpu[j]["y"] < minCpu)
					minCpu = aCpu[j]["y"];
			}
		}
		
		minMem = Math.round(minMem - (minMem / 20));
		maxMem = Math.round(maxMem + (maxMem / 20));
		minCpu = Math.round(minCpu - (minCpu / 10));
		maxCpu = Math.round(maxCpu + (maxCpu / 10));
		
		if(minMem < 0)minMem = 0;
		if(maxMem > (512*1024*1024))maxMem = 512*1024*1024;
		
		if(minCpu < 0)minCpu = 0;
		if(minCpu == maxCpu) maxCpu = minCpu + 10;
		if(maxCpu > 100)maxCpu = 100;
		
		chartOptions.yDomain1 = [minMem, maxMem];
		chartOptions.yDomain2 = [minCpu, maxCpu];
		
        //chartOptions.yDomain1: [0, 512*1024*1024],		//OPENSHIFT_GEAR_MEMORY_MB
        //chartOptions.yDomain2: [0, 99],					//cpu usage in %
	};
	
	self.fillHealthData();
	
	$interval(function ()
	{
		self.fillHealthData();

	}, 5000);

	self.buildTreeData = function(node, treeNode, recDepth, nodeName)
	{
		var nodeType = self.getType(node); 

	    if (nodeType === self.TYPE_ARRAY)
	    {
	    	var a = [];
	    	var newTreeFolder = self.buildNode("home", nodeName, "Array ["+node.length+"]", treeNode, recDepth, a);
	    	
	        for (var i=0;i<node.length;i++)
	        {
                self.buildTreeData(node[i], a, recDepth + 1, "["+(i+1)+"]");
	        }
	        for(i=0;i<a.length;i++)
	        	a[i]["parent"] = newTreeFolder;

	        if(a.length > 0)
	        	newTreeFolder["children"] = a;
	        else
	        	newTreeFolder["type"] = "doc";
	        
	        treeNode.push(newTreeFolder);
	    }
	    else if(nodeType === self.TYPE_PRIMITIVE)
	    {
	    	var newTreeNode = self.buildNode("doc", nodeName, node, treeNode, recDepth);
	    	treeNode.push(newTreeNode);	    	
		}
	    else if(nodeType === self.TYPE_OBJECT)
	    {
	    	var a = [];
	    	var newTreeFolder = self.buildNode("folder", nodeName, null, treeNode, recDepth, a);

	        for (var k in node)
	        {
	            if (node.hasOwnProperty(k))
	            {
	            	var newTreeNode = self.buildNode("folder", k, node[k], treeNode, recDepth, a);
	                self.buildTreeData(node[k], a, recDepth + 1, k);
	            }                
	        }
	        for(i=0;i<a.length;i++)
	        	a[i]["parent"] = newTreeFolder;
	        
	        if(a.length > 0)
	        	newTreeFolder["children"] = a;
	        else
	        	newTreeFolder["type"] = "doc";
	        
	        treeNode.push(newTreeFolder);
	    }
	    else
	    {
			console.log(""+recDepth+": ERR: isUnknownPrimitive:"+node+" type:"+(typeof node));
	    };
	};
	
	self.getType = function(o)
	{
		if(o == null)return self.TYPE_PRIMITIVE;
		if(!angular.isDefined(o))return self.TYPE_PRIMITIVE;
		
		var type = (""+(typeof o)).toLowerCase();
		
		if(('string' === type) || ('number' === type) || ('bool' === type)  || ('boolean' === type) || ('date' === type))
		{
			return self.TYPE_PRIMITIVE;
		}

		if(angular.isArray(o))return self.TYPE_ARRAY;
		
		return self.TYPE_OBJECT;
	};
	
	self.buildNode = function(type, label_name, label_value, parent, iLevel, siblings)
	{
    	var newTreeNode = {};
    	newTreeNode["type"] 		= type;
    	if(type === "doc")
    	{
   			var type = (""+(typeof label_value)).toLowerCase();
     		if('number' === type)
     			newTreeNode["type"] = "stats";
     		if('boolean' === type)
     			newTreeNode["type"] = "question-sign";
		}
		if (label_name.toLowerCase().indexOf("secret") > -1)
		{
			label_name = label_name.replace(/secret/gi, "...");	//TODO: do it on the server
			label_value= "...";
		}
    	newTreeNode["label"] 		= ""+label_name+"="+label_value;
    	newTreeNode["label_name"] 	= ""+label_name;
    	newTreeNode["label_value"] 	= ((label_value == null || !angular.isDefined(label_value)) ? "" : label_value);
    	newTreeNode["parent"] 		= parent;
    	newTreeNode["level"] 		= iLevel;
    	newTreeNode["siblings"]		= siblings;
		return newTreeNode;
	};
	
     self.data.treedata = [];
     
     self.onTreeNodeSelected = function(treeNode)
     {
         
     };
     
     self.getNodeMinWidth = function(node)
     {
     	var iLevel = node["level"];
     	var minWidth = 299 - (iLevel * 20);
     	return ""+minWidth+"px";
     };
     
     self.getNodeBgColor = function(node)
     {
     	{
     		var type = (""+(typeof node["label_value"])).toLowerCase();
     		if('number' === type)
     			return "yellow";
     		if('boolean' === type)
     			return "#e5ffe5";
     	}
     	
     	var parent = node["parent"];
     	if(!parent)
     	{
     		return "yellow";
     	}
     	var children = parent["children"];
     	if(!children)
     	{
     		return "#e5ffe5";
     	}
     	var idx = 0;
     	for(var i=0;i<children.length;i++)
     	{
     		if(node === children[i])
     		{
     			idx = i;break;
     		}
     	}
     	
     	if((idx % 2) === 0)
     	{
     		return "transparent";
     	}
     	return "#ffffcc";
     };
     
//CHART -----------------------
	self.data.chart.options = {
            chart: {
            	type: 'multiChart',		//type: 'lineChart', type: 'stackedAreaChart',
                height: 350,
                margin: {
                    top: 20,
                    right: 30,
                    bottom: 40,
                    left: 66
                },
				color: d3.scale.category10().range(),
                useVoronoi: true,
                clipEdge: true,
                showControls: true,
                showValues: true,
                duration: 100,
                interactive: true,
                useInteractiveGuideline: true,
                transitionDuration: 500,
                
                yDomain1: [0, 512*1024*1024],		//OPENSHIFT_GEAR_MEMORY_MB
                yDomain2: [0, 99],					//cpu usage in %
//tooltip - begin
                tooltips:true,					//TODO:
                /*
                tooltip: {
			        valueFormatter: function(d,i) {		//Format function for the tooltip values column
			            return "vvv";
			        },
			        headerFormatter: function(d) {		//Format function for the tooltip header value.
			            return d;
			        } 
                },* /
                tooltipContent: function (key, x, y, e, graph)
                {
	                return '<p><strong>' + key + '</strong></p>' +
	                '<p>' + y + ' in the month ' + x + '</p>';
            	},
                tooltip: function (key, x, y, e, graph)
                {
	                return '<p><strong>' + key + '</strong></p>' +
	                '<p>' + y + ' in the month ' + x + '</p>';
            	},* /
			  	tooltip: {
				    enabled: true,
				    type: "placeholder",
				    string: "{label}, {value}, {percentage}%"
				},*/
//tooltip - end                
                xAxis: {
                	axisLabel: 'Time',
                	staggerLabels: true,
                	rotateLabels: 3,
                    showMaxMin: true,
                    tickFormat: function(d)
                    {
                    	var diff = Math.round(((new Date().getTime()) - d) / 1000);
                    	if(isNaN(diff))return d;
                    	if(diff < 1) return "now";
                    	return "" + diff + " seconds ago";
                    }
                },
                yAxis1: {
                	axisLabel: 'Memory',
                	rotateLabels: 3,
                	staggerLabels: true,
                    tickFormat: function(d)
                    {
                    	if(isNaN(d))return d;
                    	
                    	if(d < 99)
                    	{
                    		return d+"%";
                    	}
                    	
						var formatSizeUnits = function(bytes) {
						        if      (bytes>=1000000000) {bytes=(bytes/1000000000).toFixed(2)+' GB';}
						        else if (bytes>=1000000)    {bytes=(bytes/1000000).toFixed(2)+' MB';}
						        else if (bytes>=1000)       {bytes=(bytes/1000).toFixed(2)+' KB';}
						        else if (bytes>1)           {bytes=bytes+' bytes';}
						        else if (bytes==1)          {bytes=bytes+' byte';}
						        else                        {bytes='0 byte';}
						        return bytes;
						};
						var getReadableFileSizeString = function(fileSizeInBytes) {
						
						    var i = -1;
						    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
						    do {
						        fileSizeInBytes = fileSizeInBytes / 1024;
						        i++;
						    } while (fileSizeInBytes > 1024);
						
						    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
						};
						return formatSizeUnits(d);
						return getReadableFileSizeString(d);
                        return d3.format(',.2f')(d);
                    }
                },
                yAxis2: {
                	axisLabel: 'CPU',
                	rotateLabels: 3,
                	staggerLabels: true,
                    tickFormat: function(d)
                    {
                    	return d+"%";
                    }
                },
                zoom: {
                    enabled: true,
                    scaleExtent: [1, 10],
                    useFixedDomain: false,
                    useNiceScale: false,
                    horizontalOff: true,
                    verticalOff: true,
                    unzoomEventType: 'dblclick.zoom'
                }
            }
        };
        
        self.data.chart.data = [];
});
