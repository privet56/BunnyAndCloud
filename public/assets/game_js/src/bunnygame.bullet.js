var __objbullet = null;

objloader.load(SRC_BULLET, function(result)
{
	__objbullet = result;
});

function Bullet(direction, fromClick)
{
	var g = new THREE.SphereGeometry(Bullet.RADIUS, 8, 6);
	var m = new THREE.MeshBasicMaterial({ color: fromClick ? 0x2FD63A : 0xF7ED31 });
	
	THREE.Mesh.call(this, g, m);

	this.direction = direction;
	this.speed = 1000;
	this.damage = 20;
	this.fromClick = fromClick;
	this.objbullet = null;
	var self = this;

	{
		var makebullet = function(result)
		{
			if(!result.scene)result.scene = result;
			self.objbullet = result.scene;
			var material = new THREE.MeshPhongMaterial({color: self.fromClick ? 0x2FD63A : 0xF7ED31});
			result.scene.children.forEach(function (child) {
                child.material = material;
                child.geometry.computeFaceNormals();
                child.geometry.computeVertexNormals();
            });
			result.scene.scale.set(24, 14, 14);	//bomb1	//result.scene.scale.set(6, 6, 6);	//bomb2+4__
			self.add(result.scene);
			self.material.transparent = self.material.visible = true;
			self.material.opacity = 0.0;
		};
		
		if(!__objbullet)
		{
			objloader.load(SRC_BULLET, function(result)
			{
				__objbullet = result;
				makebullet(__objbullet.clone());
			});
		}
		else
		{
			makebullet(__objbullet.clone());
		}
	}
	if(false)
	{
		var controls = new function ()
		{
            this.size = 4;
            this.transparent = true;
            this.opacity = 0.6;
            this.vertexColors = true;
            this.color = fromClick ? 0x2FD63A : 0xF7ED31;
            this.sizeAttenuation = true;
            this.rotateSystem = true;
		};
		var ps = this.createParticles(controls.size, controls.transparent, controls.opacity, controls.vertexColors, controls.sizeAttenuation, controls.color);
		this.add(ps);
		
		this.material.transparent = this.material.visible = true;
		this.material.opacity = 0.0;
	}
	if(false)
	{
	    this.avgVertexNormals = [];
	    this.avgVertexCount = [];
	    this.doExplode = true;
	    
		var ps = this.createParticleSystemFromGeometry(g, this.avgVertexNormals, this.avgVertexCount);
		this.add(ps);
		
		//this.material.transparent = this.material.visible = true;
		//this.material.opacity = 0.1;
	}
	
	if(false)
	{
        var psMat = new THREE.PointCloudMaterial(g);
        psMat.map = THREE.ImageUtils.loadTexture(SRC_SMOKE);
        psMat.color = new THREE.Color(0x5555ff);
        psMat.transparent = true;
        psMat.size = 0.2;
        psMat.blending = THREE.AdditiveBlending;
        var ps = new THREE.PointCloud(g, psMat);
        ps.sizeAttenuation = true;
        ps.sortParticles = true;
        this.add(ps);
	}
	{
		var geometry = new THREE.IcosahedronGeometry(20, 2);
		
		var mat = new THREE.ParticleSystemMaterial();
		mat.map = THREE.ImageUtils.loadTexture(fromClick ? SRC_PARTICLE1 : SRC_PARTICLE2);
		mat.blending = THREE.AdditiveBlending;
		mat.transparent = true;
		mat.size = 15;
		
		var system = new THREE.ParticleSystem(geometry, mat);
		system.sortParticles = true;
		//scene.add(system);
		system.visible = false;
		this.fireworks = system;
	}
}

Bullet.prototype = Object.create(THREE.Mesh.prototype);
Bullet.prototype.constructor = Bullet;
Bullet.RADIUS = 5;

Bullet.prototype.onStart = function()
{
	scene.add(this);
	this.visible = true;
	this.fireworks.visible = false;
/*
	scene.add(this.fireworks);
	this.fireworks.visible = true;
	this.fireworks.scale.set(1.5, 1.5, 1.5);
	
	//this.transparent = true;
	//this.opacity = 0.0;
	//this.size = 0.001;
	//this.material.transparent = true;
	//this.material.opcacity = 0.0;
*/
};

Bullet.prototype.doFirework = function(bullets, i, deadBulletPool)
{
	this.fireworks.position.copy(this.position);
	this.fireworks.visible = true;
	this.fireworks.scale.set(0.5, 0.5, 0.5);
	
	var self = this;
	
	scene.add(this.fireworks);
	scene.remove(this);
	this.visible = false;
	
	setTimeout(function()
	{
		self.fireworks.visible = false;
		scene.remove(this.fireworks);
	},
	2000);
};

Bullet.prototype.update = (function()
{
	var scaledDirection = new THREE.Vector3();
	
	return function(delta)
	{
		if(this.fireworks.visible)
		{
			this.fireworks.rotation.y += delta * 1.5;
			this.fireworks.rotation.x += delta * 1.0;
			var scale = 1 + 0.4 * delta;
			this.fireworks.scale.multiplyScalar(scale);
		}
		if(this.visible)
		{		
			scaledDirection.copy(this.direction).multiplyScalar(this.speed*delta);
			if(this.objbullet)
			{
				this.objbullet.rotation.x += 0.1;
				this.objbullet.rotation.y += 0.1;
				this.objbullet.rotation.z += 0.1;
			}
			this.position.add(scaledDirection);
			
			if (this.fireworks.visible)
			{
				this.fireworks.position.copy(this.position);
			}
		}
	};
})();

Bullet.prototype.clone = function(object)
{
	if (typeof object === 'undefined')
	{
		object = new Bullet();
	}
	THREE.Mesh.prototype.clone.call(this, object);

	object.direction = this.direction;
	object.speed = this.speed;
	object.damage = this.damage;
	object.fromClick = this.fromClick;
//TODO: copy fireworks
	return object;
};

Bullet.prototype.createParticles = function (size, transparent, opacity, vertexColors, sizeAttenuation, color)
{
    var geom = new THREE.Geometry();
    var material = new THREE.PointCloudMaterial({
        size: size,
        transparent: transparent,
        opacity: opacity,
        vertexColors: vertexColors,
        sizeAttenuation: sizeAttenuation,
        color: color
    });

    var range = 50;
    for (var i = 0; i < 1500; i++)
    {
        var particle = new THREE.Vector3(Math.random() * range - range / 2, Math.random() * range - range / 2, Math.random() * range - range / 2);
        geom.vertices.push(particle);
        var color = new THREE.Color(0x00ff00/*green*/);
        color.setHSL(color.getHSL().h, color.getHSL().s, Math.random() * color.getHSL().l);
        geom.colors.push(color);
    }

    cloud = new THREE.PointCloud(geom, material);
    cloud.name = "particles";
    return cloud;
};

Bullet.prototype.createParticleSystemFromGeometry = function(geom, avgVertexNormals, avgVertexCount)
{
    var psMat = new THREE.PointCloudMaterial();
    psMat.map = THREE.ImageUtils.loadTexture(SRC_BALL);
    psMat.blending = THREE.AdditiveBlending;
    psMat.transparent = true;
    psMat.opacity = 0.6;
    var ps = new THREE.PointCloud(geom, psMat);
    ps.sortParticles = true;
    
    this.add(ps);

    var sphere = new THREE.BoxGeometry(4, 6, 4, 20, 20, 20);
    sphere.vertices.forEach(function (v) {
        v.velocity = Math.random();
    });
    
    for (var i = 0; i < sphere.vertices.length; i++)
    {
    	avgVertexNormals.push(new THREE.Vector3(0, 0, 0));
    	avgVertexCount.push(0);
    }

    // first add all the normals
    sphere.faces.forEach(function (f)
    {
        var vA = f.vertexNormals[0];
        var vB = f.vertexNormals[1];
        var vC = f.vertexNormals[2];

        // update the count
        avgVertexCount[f.a] += 1;
        avgVertexCount[f.b] += 1;
        avgVertexCount[f.c] += 1;

        // add the vector
        avgVertexNormals[f.a].add(vA);
        avgVertexNormals[f.b].add(vB);
        avgVertexNormals[f.c].add(vC);
    });

    // then calculate the average
    for (var i = 0; i < avgVertexNormals.length; i++)
    {
    	avgVertexNormals[i].divideScalar(avgVertexCount[i]);
    }
    
    return ps;
};
