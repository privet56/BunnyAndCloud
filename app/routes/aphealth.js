var config     = require('../../config');
var logger 	   = require("../logger");

var fs = require('fs');
var path = require("path");
var util = require('util');
var pusage = require('pidusage');

var isWin = /^win/.test(process.platform);
var ipm2  = isWin ? null : require('pm2');
if( ipm2)
{
	ipm2.connect(function() {});
}

module.exports = function()
{
    var self = this;
    
	self.get = function(req, res)
	{
		if(!ipm2)
		{
			//return res.json({ message: 'No data available on '+process.platform+'!' });
			{														//dummy data
				var i = Math.floor((Math.random() * 5) + 1);		//return a random number between 1 and 5
				var s = String(fs.readFileSync(path.join(__dirname, '../../dummydata/health'+i+'.json')));
				//var ass = util.inspect(s, { showHidden: true, depth: null });
				//s = s.replace(/([\\,\\{\\[])(\w+):/g,"$1\"$2\":");//needed only if ipm2.dump
				res.send(JSON.parse(s));
				return;
			}
		}
		ipm2.list(function(err, list)
		{
		    if(err)
		    {
		      console.log(err);
		      return;
		    }
		    //var assList = util.inspect(list, { showHidden: true, depth: null });
		    res.json(list);
		    /*
		    var described = 0;
		    for(var i=0;i<list.length;i++)
		    {
		      ipm2.describe(list[i]["pm_id"], function(err, prInfo)
		      {
			  if(err)
			  {
			    console.log(err);
			    //res.json(list);
			    return;
			  }
			  
			  described++;
			  //var assPrInfo = util.inspect(prInfo, { showHidden: true, depth: null });
			  if(!list[0]["monit"])
			      list[0]["monit"] = {};
			  list[0]["monit"]["memory"+(described === 0 ? ""+described : ""+described)] = prInfo[0].memory;
			  list[0]["monit"]["cpu"   +(described === 0 ? ""+described : ""+described)] = prInfo[0].cpu;
			  //console.log("START--------------------START\n"+assPrInfo+"\nEND---------------------------END(ids.len:"+list.length+")");
			  
			  if(described >= (list.length))
			  {
			    console.log("loopEnd...described:"+described+" from "+list.length);
			    res.json(list);
			  }
		      });
		    }*/
		});
		/*
		ipm2.dump(function(err, dt)
		{
		    if(err)
		    {
		      console.log(err);
		      return;
		    }
		    var fn = process.env.PM2_HOME ? path.join(process.env.PM2_HOME, "dump.pm2") : "/root/.pm2/dump.pm2";
		    var s = String(fs.readFileSync(fn));
		    s = s.replace(/([\\,\\{\\[])(\w+):/g,"$1\"$2\":");
		    var o = JSON.parse(s);
		    pusage.stat(process.pid, function(err, stat)
		    {
		      if(err)
		      {
			console.log(err);
			return;
		      }
		      if(stat)
		      {
			if(!o[0]["monit"])
			   o[0]["monit"] = {};
			o[0]["monit"]["memory"] = stat.memory;
			o[0]["monit"]["cpu"] = stat.cpu;
		      }		      
		      res.json(o);
		    });
		    
	  	});*/
	};
	
	return self;
};
