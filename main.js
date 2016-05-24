//http://pm2.keymetrics.io/docs/usage/use-pm2-with-cloud-providers/
//and
//> rhc env set PM2_HOME=/var/lib/openshift/557805375973ca26fe000007/app-deployments/.pm2 -a bunny
//> rhc env set PM2_API_PORT=9615 -a bunny		//does not work on openshift, eaccess 9615
//> rhc env list -a bunny

var pm2 = require('pm2');

var instances = process.env.WEB_CONCURRENCY || -1; // Set by Heroku or -1 to scale to max cpu core -1

pm2.connect(function(err)
{
  if (err)
  {
    console.log(err);
    throw new Error('Error: ' + err.msg);        
  }
  pm2.start({
    script    : 'server.js',
    name      : 'bunnyandcloud',     	// ----> THESE ATTRIBUTES ARE OPTIONAL:
    watch     : false,
    exec_mode : 'cluster',            	// ----> https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#schema
    instances : instances,
    env: {                           	// If needed declare some environment variables
      NODE_ENV: "production",
	  NODE_PATH: '$NODE_PATH:.:./config'
    },
  },
  function(err)
  {
    if (err) return console.error('Error while launching applications', err.stack || err);
    console.log('PM2 and application has been succesfully started');

    pm2.launchBus(function(err, bus)	// Display logs in standard output
	{
      console.log('[PM2] Log streaming started');

      bus.on('log:out', function(packet)
	  {
       console.log('[App:%s] %s', packet.process.name, packet.data);
      });

      bus.on('log:err', function(packet)
	  {
        console.error('[App:%s][Err] %s', packet.process.name, packet.data);
      });
      
	  bus.on('close', function()
	  {
    	console.log('Bus closed');
      });
    });
  });		//end pm2.start
  
  /*pm2.web(function()			//does not work on openshift, eaccess 9615
  {
  	console.log('pm2 web started');
  });*/
});
