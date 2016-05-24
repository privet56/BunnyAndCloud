// GLOBALS ====================================================================

var scene, renderer, camera, clock, player, composer;

var HORIZONTAL_UNIT 	= 100,
		VERTICAL_UNIT 	= 100,
		INV_MAX_FPS 	= 1 / 100,
		FIRING_DELAY 	= 2000,
		BOT_MOVE_DELAY 	= 2000,
		BOT_MAX_AXIAL_ERROR = 10;
var frameDelta = 0;
var paused = true;
var spawnPoints = [];
var floor;

var bullets = [];
var deadBulletPool = [];
var deadBulletPoolFromClick = [];

var enemies = [];
var numEnemies = 5;

var USE_EDGE_EFFECT = true;
var cloud=null;
var gameStart = null;

// MAPS =======================================================================

var map = 			"   XXXXXXXX     XXXXXXXX      \n" +
					"   X      X     X      X      \n" +
					"   X  S   X     X   R  X      \n" +
					"   X      XXXXXXX      X      \n" +
					"   X                  XXXXXXXX\n" +
					"   X         S               X\n" +
					"   XXXX XX       XXXX    S   X\n" +
					"      X XX       X  X        X\n" +
					"   XXXX XXX     XX  X        X\n" +
					"   X      XX   XXXXXXTTXX  XXX\n" +
					"   X      XTTTTTXXXTTTTXX  X  \n" +
					"   XX  S  XTTTTTXXTTTTTXX  XXX\n" +
					"XXXXX     XTTTTTXTTTTTTX     X\n" +
					"X      XTTXTTTTTTTTTTTTX     X\n" +
					"X  S  XXTTTTTTTTXTTTTTXX  S  X\n" +
					"X     XTTTTTTTTTXTTTTTX      X\n" +
					"X     TTTTTTTTTTXXXXTTX  XXXXX\n" +
					"X     XTTTTTTTTTX X      X    \n" +
					"XX  XXXTTTTTTTTTX X      X    \n" +
					" X  X XTTTTTTTTTX X      X    \n" +
					" X  XXX         X X      X    \n" +
					" X             XXXX      XX   \n" +
					" XXXXX    T               X   \n" +
					"     X                 S  X   \n" +
					"     XX   B  XXXXXXXX     X   \n" +
					"      XX    XX      XXXXXXX   \n" +
					"       XXXXXX                 ";
map = map.split("\n");
var ZSIZE = map.length * HORIZONTAL_UNIT,
		XSIZE = map[0].length * HORIZONTAL_UNIT;
var meshMap = new Array(map.length);

function MapCell()
{
	this.set.apply(this, arguments);
}
MapCell.prototype.set = function(row, col, char, mesh)
{
	this.row = row;
	this.col = col;
	this.char = char;
	this.mesh = mesh;
	return this;
};

// ANIMATION LOOP =============================================================

function animate()
{
	draw();

	frameDelta += clock.getDelta();
	while (frameDelta >= INV_MAX_FPS)
	{
		update(INV_MAX_FPS);
		frameDelta -= INV_MAX_FPS;
	}

	if (!paused)
	{
		requestAnimationFrame(animate);
	}
}

function restart()
{
	self.window.location.reload();	return;
//TODO:
	player.position = player.orgPosition;
	
	scene.remove(player);
	player = new Player(TEAMS.B);
	player.add(camera);
	player.position.y = 20;
	scene.add(player);
	player.update();
	
	hud.className = 'playing';
	TEAMS.R.flag.mesh.visible = TEAMS.B.flag.mesh.visible = true;
	
	player.health = player.maxHealth;
	document.getElementById('health').textContent = player.health;
	document.getElementById('health').className = '';
	document.getElementById('crosshairs').className = '';
	document.getElementById('respawn').className = 'center hidden';
	document.getElementById('respawn_won').className = 'center hidden';
	player.respawning = false;

	startAnimating();
}

function startAnimating()
{
	if (paused)
	{
		paused = false;
		clock.start();
		requestAnimationFrame(animate);
	}
}

function stopAnimating()
{
	paused = true;
	clock.stop();
}

// SETUP ======================================================================

function setup()
{
	setupThreeJS();
	setupWorld();
	setupEnemies();
	requestAnimationFrame(animate);
	spawn();
	
	{
		cloud = createPointCloud(3, true, 0.6, true, 0xffffff);
	}
}

function setupThreeJS()
{
	scene = new THREE.Scene();
	//scene.fog = new THREE.FogExp2(0xdcf7e7, 0.001);					//TODO: fog or no fog?	//better: sun!

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setClearColor(new THREE.Color(0x000000, 1.0));
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.shadowMapEnabled = true;
	renderer.setSize(window.innerWidth, window.innerHeight);
	var e = document.body;//document.getElementById("game")
	e.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 10000);
	clock = new THREE.Clock(false);

	composer = new THREE.EffectComposer(renderer);
	
	//var effect = new THREE.ShaderPass(THREE.EdgeShader);
	//effect.uniforms['aspect'].value.x = renderer.domElement.width;
	//effect.uniforms['aspect'].value.y = renderer.domElement.height;
	//composer.addPass(effect);

	{
		// add background using a camera
        var cameraBG = new THREE.OrthographicCamera(-window.innerWidth, window.innerWidth, window.innerHeight, -window.innerHeight, -10000, 10000);
        cameraBG.position.z = 50;
        var sceneBG = new THREE.Scene();

        var materialColor = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture(SRC_BACKGROUND), depthTest: false });
        var bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialColor);
        bgPlane.position.z = 100;
        bgPlane.scale.set(window.innerWidth * 2, window.innerHeight * 2, 1);
        sceneBG.add(bgPlane);
        var bgPass = new THREE.RenderPass(sceneBG, cameraBG);
        composer.addPass(bgPass);
	}
    var renderPass = new THREE.RenderPass(scene, camera);
    renderPass.clear = false;
    composer.addPass(renderPass);

	var effect = new THREE.ShaderPass(THREE.CopyShader);
	effect.renderToScreen = true;
	composer.addPass(effect);
}

function setupWorld()
{
	setupMap();

	player = new Player(TEAMS.B);
	player.add(camera);
	player.position.y = 20;
	scene.add(player);
	
	var light = new THREE.DirectionalLight(0xfffaf3, 1.5);
	light.position.set(1, 1, 1);
	light.castShadow = true;
	scene.add(light);
	light = new THREE.DirectionalLight(0xf3faff, 0.75);
	light.position.set(-1, - 0.5, -1);
	scene.add(light);
}

function setupMap()
{
	for (var i = 0, rows = map.length; i < rows; i++)
	{
		for (var j = 0, cols = map[i].length; j < cols; j++)
		{
			if (typeof meshMap[i] === 'undefined')
			{
				meshMap[i] = new Array(cols);
			}
			meshMap[i][j] = addVoxel(map[i].charAt(j), i, j);
		}
	}

	var material = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
	{
		THREE.ImageUtils.loadTexture(SRC_GRASS, undefined, function(grass)
		{
			material = new THREE.MeshBasicMaterial({ map: grass });
			var floorGeo = new THREE.PlaneGeometry(XSIZE, ZSIZE, 20, 20);
			floor = new THREE.Mesh(floorGeo, material);
			floor.rotation.x = Math.PI * -0.5;
			floor.position.set(HORIZONTAL_UNIT, 0, -HORIZONTAL_UNIT); // Ideally this wouldn't be needed
			floor.receiveShadow = true;
			scene.add(floor);
			
			{
		        var directionalLight = new THREE.DirectionalLight();
		        directionalLight.position.x = -250;
		        directionalLight.position.y = 1999;
		        directionalLight.position.z = 1000;
		        directionalLight.castShadow = true;
		        directionalLight.shadowCameraVisible = false;
		        directionalLight.shadowCameraNear = 25;
		        directionalLight.shadowCameraFar = 200;
		        directionalLight.shadowCameraLeft = -50;
		        directionalLight.shadowCameraRight = 50;
		        directionalLight.shadowCameraTop = 50;
		        directionalLight.shadowCameraBottom = -50;
		        directionalLight.shadowMapWidth = 2048;
		        directionalLight.shadowMapHeight = 2048;
		        //directionalLight.intensity=222;

		        directionalLight.visible = true;

		        directionalLight.name = 'dirLight';
		        scene.add(directionalLight);

		        {
		        	loader.load(SRC_PLANET, function(result)
        			//objloader.load('models/planet/Termanation.obj', function(result)
        			{
		        		if(!result.scene)result.scene = result;	//for objLoader
        				var m = result.scene;
    					var material = new THREE.MeshPhongMaterial({color: 0xE8313D});
    					setMaterial(result.scene, material);
        				m.position.copy(directionalLight.position);
        				m.position.y += 33;
        				m.scale.set(66, 66, 66);
        				scene.add(m);
        			});		        	
		        }
		        if(false)
		        {
		        	 var sphereGeometry = new THREE.SphereGeometry(199, 199, 199);
		             var sphereMaterial = new THREE.MeshLambertMaterial({color: 0xE04E34});
		             var e = new THREE.Mesh(sphereGeometry, sphereMaterial);
					 e.position.copy(directionalLight.position);
					 e.position.y += 333;
					 e.scale.set(4, 4, 4);
					 e.castShadow = true;
					 scene.add(e);
		        }
		        if(false)
		        {	//TODO: no edges!
		    		THREE.ImageUtils.loadTexture(SRC_LENSFLARE0, undefined, function(lens)
    				{
    					var geometry = new THREE.CubeGeometry(HORIZONTAL_UNIT, VERTICAL_UNIT, HORIZONTAL_UNIT, VERTICAL_UNIT);
    					var material = new THREE.MeshBasicMaterial({ map: lens, transparent: true });
    					var e = new Player(null, geometry, material);
    					e.position.copy(directionalLight.position);
    					e.scale.set(44, 44, 44);
    					scene.add(e);
    				});
		        }
		        {	// TODO: why are lens flares not working?
					var textureFlare0 = THREE.ImageUtils.loadTexture(SRC_LENSFLARE0);
					var textureFlare2 = THREE.ImageUtils.loadTexture(SRC_LENSFLARE2);
					var textureFlare3 = THREE.ImageUtils.loadTexture(SRC_LENSFLARE3);
					
					var addl = function addLight( h, s, l, x, y, z ) {

						var light = new THREE.PointLight( 0xffffff, 1.5, 4500 );
						light.color.setHSL( h, s, l );
						light.position.set( x, y, z );
						scene.add( light );

						var flareColor = new THREE.Color( 0xffffff );
						flareColor.setHSL( h, s, l + 0.5 );

						var lensFlare = new THREE.LensFlare( textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor );

						lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
						lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
						lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );

						lensFlare.add( textureFlare3, 60, 0.6, THREE.AdditiveBlending );
						lensFlare.add( textureFlare3, 70, 0.7, THREE.AdditiveBlending );
						lensFlare.add( textureFlare3, 120, 0.9, THREE.AdditiveBlending );
						lensFlare.add( textureFlare3, 70, 1.0, THREE.AdditiveBlending );
						
						lensFlare.scale.set(214, 214, 214);

						//lensFlare.customUpdateCallback = lensFlareUpdateCallback;
						lensFlare.position.copy( light.position );

						scene.add( lensFlare );
					};

					addl( 0.55, 0.9, 0.5, directionalLight.x, directionalLight.y, directionalLight.z );
		        }
			}
		});
	}
}

var addVoxel = (function()
{
	var XOFFSET = map.length * 0.5 * HORIZONTAL_UNIT,
			ZOFFSET = map[0].length * 0.5 * HORIZONTAL_UNIT,
			materials = [];
	for (var i = 0; i < 8; i++)
	{
		materials.push(new THREE.MeshPhongMaterial({
			color: new THREE.Color().setHSL(Math.random() * 0.2 + 0.3, 0.5, Math.random() * 0.25 + 0.75)
		}));
	}
	function material()
	{
		return materials[Math.floor(Math.random() * materials.length)].clone();
	}

	var WALL = new THREE.CubeGeometry(HORIZONTAL_UNIT, VERTICAL_UNIT, HORIZONTAL_UNIT);

	return function(type, row, col)
	{
		var z = (row+1) * HORIZONTAL_UNIT - ZOFFSET,
				x = (col+1) * HORIZONTAL_UNIT - XOFFSET,
				mesh;
		switch(type)
		{
			case ' ': break;
			case 'S':
				spawnPoints.push(new THREE.Vector3(x, 0, z));
				break;
			case 'R':
			case 'B':
				
				objloader.load(SRC_PINECONE, function(result) {				//pinecone.obj is ok, too 
				//objloader.load('models/g7/estrellica.obj', function(result) {	
					result.scene = result;
				//loader.load('models/bunny/3/stanford-bunny.dae', function(result) {
					result.scene.scale.set(66, 66, 66);		//pinacone
					
					//result.scene.scale.set(1, 1, 1);		//coin
					//result.scene.rotation.x += 55;
					
					result.scene.position.set(x, VERTICAL_UNIT*0.5, z);	//x:-250 y:50 z:1000
					var material = new THREE.MeshPhongMaterial({color: 0xE8313D});
					setMaterial(result.scene, material);
					
					result.scene.children.forEach(function (child) {
		                child.material = material;
		                child.geometry.computeFaceNormals();
		                child.geometry.computeVertexNormals();
		            });
		            
					if (type === 'B') result.scene.rotation.y = Math.PI;
					scene.add(result.scene);
					TEAMS[type].flag = new MapCell(row, col, type, result.scene);	//row:2, col:20
					TEAMS[type].target = result.scene;
					//var cheering = new THREE.AudioObject('sounds/cheering.ogg', 0, 1, false);
					//scene.add(cheering);
					//TEAMS[type].cheering = cheering;
				});
				
				var geometry = new THREE.IcosahedronGeometry(200, 2);
				
				var mat = new THREE.ParticleSystemMaterial();
				mat.map = THREE.ImageUtils.loadTexture((type === 'B') ? SRC_PARTICLE1 : SRC_PARTICLE2);
				mat.blending = THREE.AdditiveBlending;
				mat.transparent = true;
				mat.size = 25;
				
				/*var mat = new THREE.ParticleBasicMaterial({
					color: type === 'R' ? TEAMS.R.color : TEAMS.B.color,
					size: 10,
					blending: THREE.AdditiveBlending,
					transparent: true,
				});*/
				
				var system = new THREE.ParticleSystem(geometry, mat);
				system.sortParticles = true;
				system.position.set(x, VERTICAL_UNIT * 0.5, z);
				scene.add(system);
				system.visible = false;
				TEAMS[type].fireworks = system;
				break;
			case 'T':
				mesh = new THREE.Mesh(WALL.clone(), material());
				mesh.position.set(x, VERTICAL_UNIT*0.5, z);
				
				mesh.material.transparent = mesh.material.visible = true;
				mesh.material.opacity = 0.0;

				break;
			case 'X':
				mesh = new THREE.Mesh(WALL.clone(), material());
				mesh.scale.y = 3;				
				mesh.position.set(x, VERTICAL_UNIT*1.5, z);
				
				mesh.material.transparent = mesh.material.visible = true;
				mesh.material.opacity = 0.0;

				break;
		}
		if (typeof mesh !== 'undefined')
		{
			scene.add(mesh);
			mesh.type = type; 
		}
		return mesh;
	};
})();

function setupEnemies()
{
	jsonloader.load(SRC_OGRE, function (geometry, mat)
	{
        geometry.computeMorphNormals();

        var mat = new THREE.MeshLambertMaterial({
                    map: THREE.ImageUtils.loadTexture(SRC_OGRE_TEXTURE),
                    morphTargets: true, morphNormals: true
                });

		var now = Date.now();
		var numBlue = Math.floor((numEnemies+1) * 0.5);

		for (var i = 0; i < numEnemies; i++)
		{
			var material = mat;
			var team = TEAMS.R;
			var enemy = new Player(team, geometry, material.clone(), true);
			spawn(enemy);
			enemies.push(enemy);
			scene.add(enemy);
			enemy.lastShot = now + Math.random() * FIRING_DELAY;
			enemy.lastMove = now + Math.random() * BOT_MOVE_DELAY;
		}
	});
}

window.addEventListener('resize', function()
{
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = renderer.domElement.width / renderer.domElement.height;
	camera.updateProjectionMatrix();
	draw();
}, false);

// DRAW =======================================================================

function draw()
{
	if (USE_EDGE_EFFECT)
	{
		renderer.autoClear = false;
		composer.render();
	}
	else
	{
		renderer.render(scene, camera);
	}
}

// UPDATE =====================================================================

function update(delta)
{
	player.update(delta);
	checkPlayerCollision(player);
	checkHasFlag(player);

	for (var i = bullets.length - 1; i >= 0; i--)
	{
		bullets[i].update(delta);
		checkBulletCollision(bullets[i], i);
	}
	
	for(var i=0;i<deadBulletPool.length;i++)
		deadBulletPool[i].update(delta);
	for(var i=0;i<deadBulletPoolFromClick.length;i++)
		deadBulletPoolFromClick[i].update(delta);

	var now = Date.now();
	for (var j = 0; j < numEnemies; j++)
	{
		var enemy = enemies[j];
		if(!enemy)continue;
		if( enemy.updateAnimation)enemy.updateAnimation(delta * 1000);
		
		if(!enemy || !enemy.update)continue;
		enemy.update(delta);
		checkPlayerCollision(enemy);
		if (enemy.health <= 0)
		{
			enemy.health = enemy.maxHealth;
			spawn(enemy);
		}
		if (enemy.lastShot + FIRING_DELAY <= now)
		{
			shoot(enemy, closestEnemy(enemy), false);
			enemy.lastShot = now;
		}
		if (enemy.lastMove + BOT_MOVE_DELAY <= now)
		{
			move(enemy);
			enemy.lastMove = now;
		}
	}

	if (player.health <= 0)
	{
		respawn();
	}
	
	for (var team in TEAMS)
	{
		if (TEAMS[team].target && TEAMS[team].target.visible)
		{
			TEAMS[team].target.rotation.y += delta * 5.0;
		}
		
		if (TEAMS.hasOwnProperty(team) && TEAMS[team].fireworks.visible)
		{
			TEAMS[team].fireworks.rotation.y += delta * 1.5;
			TEAMS[team].fireworks.rotation.x += delta * 1.0;
			var scale = 1 + 0.4 * delta;
			TEAMS[team].fireworks.scale.multiplyScalar(scale);
		}
	}
	if(cloud)
	{
		var vertices = cloud.geometry.vertices;
        vertices.forEach(function (v)
        {
            v.y = v.y - (v.velocityY);
            v.x = v.x - (v.velocityX);

            if (v.y <= 0) v.y = 60;
            if (v.x <= -20 || v.x >= 20) v.velocityX = v.velocityX * -1;
        });
	}
}

function spawn(unit)
{
	unit = unit || player;
	var cell = new MapCell(), point;
	do
	{
		point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
		mapCellFromPosition(point, cell);
	}
	while (isPlayerInCell(cell.row, cell.col));
	
	unit.position.copy(point);
	unit.position.y = unit.cameraHeight;
	var direction = (point.z > 0 ? 0 : -1) * Math.PI;
	unit.rotation.set(0, direction, 0);
}

function respawn()
{
	player.health = player.maxHealth;
	player.respawning = true;
	document.getElementById('crosshairs').className = 'hidden';
	document.getElementById('respawn').className = 'center';
	var countdown = document.querySelectorAll('#respawn .countdown')[0];
	setTimeout(function()
	{
		countdown.textContent = '2';
		setTimeout(function()
		{
			countdown.textContent = '1';
			setTimeout(function()
			{
				countdown.textContent = '3';
				document.getElementById('health').textContent = player.health;
				document.getElementById('health').className = '';
				document.getElementById('crosshairs').className = '';
				document.getElementById('respawn').className = 'center hidden';
				player.respawning = false;
				spawn();
			}, 1000);
		}, 1000);
	}, 1000);
}

var isPlayerInCell = (function()
{
	var cell = new MapCell();
	return function(row, col) {
		mapCellFromPosition(player.position, cell);
		if (cell.row == row && cell.col == col) return true;
		for (var i = 0, l = enemies.length; i < l; i++) {
			mapCellFromPosition(enemies[i].position, cell);
			if (cell.row == row && cell.col == col) return true;
		}
		return false;
	};
})();

function move(bot) {
	bot.rotation.y = Math.random() * Math.PI * 2;
	var leftBias = bot.moveDirection.LEFT ? -0.1 : 0.1;
	var forwardBias = bot.moveDirection.FORWARD ? -0.1 : 0.1;
	bot.moveDirection.LEFT = Math.random() + leftBias < 0.1;
	bot.moveDirection.RIGHT = !bot.moveDirection.LEFT && Math.random() + leftBias < 0.1;
	bot.moveDirection.FORWARD = Math.random() + forwardBias < 0.8;
	bot.moveDirection.BACKWARD = !bot.moveDirection.FORWARD && Math.random() < 0.05;
	if (Math.random() < 0.4) bot.jump();
}

// COLLISION =================================================================

var checkPlayerCollision = (function()
{
	var cell = new MapCell();
	return function(player)
	{
		player.collideFloor(floor.position.y);
		mapCellFromPosition(player.position, cell);
		switch (cell.char) {
			case ' ':
			case 'S':
			case 'R':
			case 'B':
				if (Math.floor(player.position.y - player.cameraHeight) <= floor.position.y)
				{
					player.canJump = true;
				}
				break;
			case 'T':
				var topPosition = cell.mesh.position.y + VERTICAL_UNIT * 0.5;
				if (player.collideFloor(topPosition))
				{
					player.canJump = true;
				}
				else if (player.position.y - player.cameraHeight * 0.5 < topPosition)
				{
					moveOutside(cell.mesh.position, player.position);
				}
				break;
			case 'X':
				moveOutside(cell.mesh.position, player.position);
				break;
		}
	};
})();

var checkBulletCollision = (function()
{
	var cell = new MapCell();
	function removeBullet(bullet, i)
	{
		bullet.doFirework(bullets, i, (bullet.fromClick) ? deadBulletPoolFromClick : deadBulletPool);	//scene.remove(bullet);
		
		if(bullet.fromClick)deadBulletPoolFromClick.push(bullet);
		else				deadBulletPool.push(bullet);
		
		bullets.splice(i, 1);
	}
	return function(bullet, i)
	{
		if (bullet.team !== player.team && spheresOverlap(bullet, player))
		{
			var now = new Date().getTime();
			if((now - gameStart) > 5000) 
				hurt(bullet);
			removeBullet(bullet, i);
		}
		for (var j = 0; j < numEnemies; j++)
		{
			var enemy = enemies[j];
			if (bullet.team !== enemy.team && spheresOverlap(bullet, enemy))
			{
				enemy.health -= bullet.damage;
				removeBullet(bullet, i);
				// Darken enemy as it gets damaged
				var color = enemy.material.color;
				var percent = ((enemy.health / enemy.maxHealth) + 0.3) / 1.3;
				enemy.material.color.setRGB(
					percent * color.r,
					percent * color.g,
					percent * color.b
				);
				break;
			}
		}
		mapCellFromPosition(bullet.position, cell);
		if ((cell.char == 'X') ||
			(cell.char == 'T' && bullet.position.y - Bullet.RADIUS < cell.mesh.position.y + VERTICAL_UNIT * 0.5) ||
			(bullet.position.y - Bullet.RADIUS < floor.position.y) ||
			(bullet.position.y > VERTICAL_UNIT * 5))
		{
			removeBullet(bullet, i);
		}
	};
})();

function mapCellFromPosition(position, cell)
{
	cell = cell || new MapCell();
	var XOFFSET = (map.length+1) * 0.5 * HORIZONTAL_UNIT,
			ZOFFSET = (map[0].length+1) * 0.5 * HORIZONTAL_UNIT;
	var mapCol = Math.floor((position.x + XOFFSET) / HORIZONTAL_UNIT) - 1,
			mapRow = Math.floor((position.z + ZOFFSET) / HORIZONTAL_UNIT) - 1,
			char = mapRow < map.length ? map[mapRow].charAt(mapCol) : -1,
			mesh = mapRow < map[0].length ? meshMap[mapRow][mapCol] : -1;
	return cell.set(mapRow, mapCol, char, mesh);
}

function moveOutside(meshPosition, playerPosition)
{
	var mw = HORIZONTAL_UNIT, md = HORIZONTAL_UNIT,
			mx = meshPosition.x - mw * 0.5, mz = meshPosition.z - md * 0.5;
	var px = playerPosition.x, pz = playerPosition.z;
	if (px > mx && px < mx + mw && pz > mz && pz < mz + md)
	{
		var xOverlap = px - mx < mw * 0.5 ? px - mx : px - mx - mw,
				zOverlap = pz - mz < md * 0.5 ? pz - mz : pz - mz - md;
		if (Math.abs(xOverlap) > Math.abs(zOverlap)) playerPosition.x -= xOverlap;
		else playerPosition.z -= zOverlap;
	}
}

// SHOOTING ===================================================================

var shoot = (function(fromClick)
{
	var negativeZ = new THREE.Vector3(0, 0, -1);
	var error = new THREE.Vector3();
	function produceError(deg)
	{
		if (typeof deg === 'undefined') deg = BOT_MAX_AXIAL_ERROR;
		return Math.random() * (deg / 90) - (deg / 180);
	}
	return function(from, to, fromClick)
	{
		from = from || player;
		
		var bullet = null;
		
		if(fromClick)
			bullet = deadBulletPoolFromClick.length ? deadBulletPoolFromClick.pop() : new Bullet(null, true);
		else
			bullet = deadBulletPool.length ? deadBulletPool.pop() : new Bullet(null, false);
		
		bullet.position.copy(from.position);
		bullet.rotation.copy(from.rotation);
		bullet.onStart();
		
		if (to)
		{
			bullet.direction = to.position.clone().sub(from.position).normalize();
		}
		else
		{
			bullet.direction = negativeZ.clone().applyQuaternion(from.quaternion);
		}
		error.set(produceError(), produceError(), produceError());
		bullet.direction.add(error);
		bullet.team = from.team;
		bullets.push(bullet);
		//scene.add(bullet);
	};
})();

function spheresOverlap(obj1, obj2)
{
	var combinedRadius = obj1.constructor.RADIUS + obj2.constructor.RADIUS;
	return combinedRadius * combinedRadius >= obj1.position.distanceToSquared(obj2.position);
}

function hurt(bullet)
{
	if (player.respawning) return;
	player.health -= bullet.damage;
	document.getElementById('health').textContent = Math.max(0, player.health);
	if (player.health < player.maxHealth * 0.25)
	{
		document.getElementById('health').className = 'low';
	}
	document.getElementById('hurt').className = '';
	if (player._hurtTimeout) clearTimeout(player._hurtTimeout);
	player._hurtTimeout = setTimeout(function()
	{
		document.getElementById('hurt').className = 'hidden';
	}, 150);
}

// This is not very efficient for large numbers of bots
// but it will do for small numbers
function closestEnemy(bot)
{
	var minDistSq = Infinity, distSq = Infinity, target = null;
	for (var i = 0; i < numEnemies; i++)
	{
		if (bot.team !== enemies[i].team)
		{
			distSq = bot.position.distanceToSquared(enemies[i].position);
			if (distSq < minDistSq)
			{
				minDistSq = distSq;
				target = enemies[i];
			}
		}
	}
	if (bot.team !== player.team)
	{
		distSq = bot.position.distanceToSquared(player.position);
		if (distSq < minDistSq)
		{
			target = player;
		}
	}
	return target;
}

// TEAMS ======================================================================

function Team(name, color, flag)
{
	this.name = name;
	this.color = color || 0xee1100;
	this.flag = flag || null;
}

var TEAMS = {
	R: new Team('Red', 0xee1100),		//=Enemies
	B: new Team('Blue', 0x0066ee)		//=the Player
};

function checkHasFlag(unit)
{
	if(unit != player)return;

	if(!TEAMS.R.flag || !TEAMS.R.flag.mesh)return;
	if(!TEAMS.B.flag || !TEAMS.B.flag.mesh)return;
	
	var teamHavingFlag = null;

	if(TEAMS.R.flag.mesh.visible && isPlayerInCell(TEAMS.R.flag.row, TEAMS.R.flag.col))
		teamHavingFlag = TEAMS.R;
	else if(TEAMS.B.flag.mesh.visible && isPlayerInCell(TEAMS.B.flag.row, TEAMS.B.flag.col))
		teamHavingFlag = TEAMS.B;
	
	if(!teamHavingFlag) return false;
	
	teamHavingFlag.flag.mesh.visible = false;
	//console.log(unit.team === TEAMS.R ? TEAMS.R.name : TEAMS.B.name + ' team scored!');
	
	teamHavingFlag.fireworks.visible = true;
	teamHavingFlag.fireworks.scale.set(0.5, 0.5, 0.5);
	setTimeout(function()
	{
		teamHavingFlag.fireworks.visible = false;
		
		//won?
		if(TEAMS.R.flag && TEAMS.R.flag.mesh && TEAMS.B.flag && TEAMS.B.flag.mesh)
		{
			if(!TEAMS.R.flag.mesh.visible && !TEAMS.B.flag.mesh.visible)
			{
				player.respawning = true;
				stopAnimating();
				document.getElementById('crosshairs').className = 'hidden';
				document.getElementById('respawn_won').className = 'center';
			}
		}
	},
	3000);
	
	//var cheering = unit.team === TEAMS.R ? TEAMS.R.cheering : TEAMS.B.cheering;
	//THREE.AudioObject.call(cheering, 'sounds/cheering.ogg', 1, 1, false);
	
	return true;
}

// INPUT ======================================================================

document.addEventListener('mousemove', function(event)
{
	if (!paused)
	{
		player.rotate(event.movementY, event.movementX, 0);
	}
}, false);

document.addEventListener('keydown', function(event)
{
	// Allow CTRL+L, CTRL+T, CTRL+W, and F5 for sanity
	if (!event.ctrlKey || !(event.keyCode == 76 || event.keyCode == 84 || event.keyCode == 87))
	{
		if (event.keyCode != 116)
		{
			event.preventDefault();
		}
	}
	switch (event.keyCode)
	{
		case 38: // up
		case 87: // w
			player.moveDirection.FORWARD = true;
			break;
		case 37: // left
		case 65: // a
			player.moveDirection.LEFT = true;
			break;
		case 40: // down
		case 83: // s
			player.moveDirection.BACKWARD = true;
			break;
		case 39: // right
		case 68: // d
			player.moveDirection.RIGHT = true;
			break;
		case 32: // space
			player.jump();
			break;
	}
}, false);

document.addEventListener('keyup', function(event)
{
	switch (event.keyCode)
	{
		case 38: // up
		case 87: // w
			player.moveDirection.FORWARD = false;
			break;
		case 37: // left
		case 65: // a
			player.moveDirection.LEFT = false;
			break;
		case 40: // down
		case 83: // s
			player.moveDirection.BACKWARD = false;
			break;
		case 39: // right
		case 68: // d
			player.moveDirection.RIGHT = false;
			break;
		case 32: // space
		{
			if(paused)
			{
				restart();
			}
			break;
		}
	}
}, false);

document.addEventListener('click', function(event)
{
	if (!paused)
	{
		event.preventDefault();
		shoot(null, null, true);
	}
});

// RUN ========================================================================

document.getElementById('start').addEventListener('click', function()
{
	if (BigScreen.enabled)
	{
		var instructions = this;
		var hud = document.getElementById('hud');
		
		var game = document.body;//document.getElementById("game");	//document.body //renderer.domElement

		BigScreen.request(game, function()
		{
			PL.requestPointerLock(game, function()
			{
				gameStart = new Date().getTime();
				document.getElementById('health').textContent = player.health;
				document.getElementById('health').className = '';
				document.getElementById('crosshairs').className = '';
				document.getElementById('respawn').className = 'center hidden';
				document.getElementById('respawn_won').className = 'center hidden';
				
				//$("#game canvas").css("z-index", "8").show();
				instructions.className = 'hidden';
				hud.className = 'playing';
				startAnimating();
				
				window.parent.onGamePlayingStarted();
			},
			function()
			{
				// We can lose pointer lock but keep full screen when alt-tabbing away
				stopAnimating();
				self.window.location.reload();
				//$("#game canvas").hide();
			},
			function()
			{
				alert('Error: entering pointer lock failed');
			});
		},
		function()
		{
			instructions.className = 'exited';
			hud.className = 'hidden';
			stopAnimating();
			self.window.location.reload();
			//$("#game canvas").hide();
		},
		function()
		{
			alert('Error: entering full screen failed');
		});
	}
	else
	{
		// We could fall back to alternative controls,
		// but for simplicity's sake, just complain.
		alert('Error: full screen not supported');
	}
});

loader.load(SRC_TREE1, function(result)
{
	var loadedTree = result.scene;
	loadedTree.rotation.x = -90;
	loadedTree.position.y = -60;
	loadedTree.scale.set(24, 14, 14);
	setMaterial(loadedTree, null);
	
	loader.load(SRC_TREE2, function(result)
	{
		setup();
		
		var loadedBush = result.scene;
		loadedBush.position.y = -70;
		loadedBush.scale.set(24, 14, 14);
		
		//set to greeen!
		setMaterial(loadedBush, new THREE.MeshPhongMaterial({color: 0x436B2F}));
		
		var i=0;
		scene.traverse(function(node)
		{
			if(node.type && (node.type == 'X' || node.type == 'T'))
			{
				node.material.transparent = node.material.visible = true;
				node.material.opacity = 0.0;

				i++;
				var tree = (i%4==0) ? loadedBush : loadedTree;
				var treeclone = tree.clone();
				treeclone.geometry = node.geometry;
				treeclone.castShadow = true;
			
				if(tree == loadedTree)
				{
					treeclone.scale.y = tree.scale.y * (Math.random() + 1.7);
					treeclone.scale.x = tree.scale.x * (Math.random() + 1.7);
					treeclone.scale.z = tree.scale.z * (Math.random() + 1.7);
					treeclone.rotation.x = tree.rotation.x * ((Math.random()/100) + 0.99);
					treeclone.rotation.y = tree.rotation.y * (Math.random() + 1.7);
					treeclone.rotation.z = tree.rotation.z * (Math.random() + 1.7);
					node.add(treeclone);
				}
				else
				{
					node.add(treeclone);
				}
			}
		});
		
		//$("#game canvas").hide();
	});
});
