setMaterial = function(node, material)
{
	if(material)node.material = material;
	node.castShadow = true;
	node.shading = THREE.SmoothShading;
	if (node.children)
	{
	    for (var i = 0; i < node.children.length; i++)
	    {
	      setMaterial(node.children[i], material);
	    }
	}
};

function createPointCloud(size, transparent, opacity, sizeAttenuation, color)
{
	return null;	//TODO!
    var texture = THREE.ImageUtils.loadTexture("game_images/raindrop-3.png");
    var geom = new THREE.Geometry();

    var material = new THREE.ParticleBasicMaterial({
        size: size,
        transparent: transparent,
        opacity: opacity,
        map: texture,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: sizeAttenuation,
        color: color
    });

    var range = 4000;
    for (var i = 0; i < 1500; i++)
    {
    	var x = Math.random() * range - range / 2;
    	var y = Math.random() * range * 1.5;
    	var z = Math.random() * range - range / 2;
        var particle = new THREE.Vector3(x, y, z);
        particle.velocityY = 0.1 + Math.random() / 5;
        particle.velocityX = (Math.random() - 0.5) / 3;
        geom.vertices.push(particle);
    }

    var cloud = new THREE.ParticleSystem(geom, material);
    cloud.sortParticles = true;

    scene.add(cloud);
    
    return cloud;
}
