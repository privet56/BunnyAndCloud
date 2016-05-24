"use strict";

(function()
{
	
var Container = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text,
	resources = PIXI.loader.resources,
    Graphics = PIXI.Graphics;

//Create a Pixi stage and renderer
var stage = new Container(),
    renderer = autoDetectRenderer(950, 512);
document.getElementById("a2").appendChild(renderer.view);

//Set the canvas's border style and background color
//renderer.view.style.border = "1px dashed black";
renderer.backgroundColor = "0xFFFFFF";
renderer.view.style.textAlign="center";
renderer.view.style.padding = renderer.view.style.margin = "0px";

//load an image and run the `setup` function when it's done
loader.add("images/treasureHunter.json").add("images/adventuress.png").add("images/button.json").load(setup);

//Define any variables that are used in more than one function
var state = undefined,
    treasure = undefined,
    blobs = undefined,
    chimes = undefined,
    exit = undefined,
    adventuress = undefined,
    healthBar = undefined,
    message = undefined,
	levelMessage = undefined,
    gameScene = undefined,
    dungeon = undefined,
    door = undefined,
    gameOverScene = undefined,
    enemies = undefined,
    su = undefined,
	dust = undefined,
	tink = undefined;

  //Make the blobs
  var numberOfBlobs = 6,
      spacing = 48,
      xOffset = 150,
      speed = 2,
      direction = 1;
	
function setup()
{
  //Make the game scene and add it to the stage
  gameScene = new Container();
  stage.addChild(gameScene);
  
	su = new SpriteUtilities(PIXI);	//Create a new instance of SpriteUtilities
		
	//particles setup
	dust = new Dust(PIXI);
	
  //Make the sprites and add them to the `gameScene`

  //Dungeon
  dungeon = su.sprite("dungeon.png");
  gameScene.addChild(dungeon);

  //Door
  door = su.sprite("door.png");
  door.position.set(32, 0);
  gameScene.addChild(door);

  //Adventuress
  var frames = su.filmstrip("images/adventuress.png", 32, 32);
  adventuress = su.sprite(frames);
  adventuress.x = 68;
  adventuress.y = gameScene.height / 5 - adventuress.height / 2;
  adventuress.xOrg = adventuress.x;
  adventuress.yOrg = adventuress.y;
  adventuress.vx = 0;
  adventuress.vy = 0;
  gameScene.addChild(adventuress);

  //The adventuress's animation states
  adventuress.states = {
    down: 0,
    left: 3,
    right: 6,
    up: 9,
    walkDown: [0, 2],
    walkLeft: [3, 5],
    walkRight: [6, 8],
    walkUp: [9, 11]
  };

  //Treasure
  treasure = su.sprite("treasure.png");
  treasure.x = gameScene.width - treasure.width - 48;
  treasure.y = gameScene.height / 2 - treasure.height / 2;
  treasure.xOrg = treasure.x;
  treasure.yOrg = treasure.y;
  gameScene.addChild(treasure);

  //An array to store all the blob monsters
  blobs = [];

  //Make as many blobs as there are `numberOfBlobs`
  for (var i = 0; i < numberOfBlobs; i++)
  {
	makeBlob(i);
  }

  //Create the health bar
  healthBar = new Container();
  healthBar.position.set(stage.width - 170, 4);
  gameScene.addChild(healthBar);

  //Create the black background rectangle
  var innerBar = new Graphics();
  innerBar.beginFill(0xFF3300/*=red*//*0x000000/*black*/);
  innerBar.drawRect(0, 0, 128, 8);
  innerBar.endFill();
  healthBar.addChild(innerBar);

  //Create the front red rectangle
  var outerBar = new Graphics();
  outerBar.beginFill(0x33FF00/*=green*//*0xFF3300/*red*/);
  outerBar.drawRect(0, 0, 128, 8);
  outerBar.endFill();
  healthBar.addChild(outerBar);

  healthBar.outer = outerBar;
  healthBar.inner = innerBar;

  //Create the `gameOver` scene
  gameOverScene = new Container();
  stage.addChild(gameOverScene);
  
  showViaDust(true, door, adventuress, treasure);

  //Make the `gameOver` scene invisible when the game first starts
  gameOverScene.visible = false;	//gameScene.visible = false;

  //Create the text sprite and add it to the `gameOver` scene
  message = new Text("The End!", { font: "bold 36px Futura", align:"center" });
  message.width = stage.width;
  message.x = 120;
  message.x = renderer.view.width / 2 - message.width / 2;
  message.x = 30;
  message.y = stage.height / 3;
  gameOverScene.addChild(message);
	{
	  levelMessage = new Text("Level: 1", { font: "18px Futura", align:"center", fill:"red" });
	  levelMessage.x = door.x + door.width + 5;
	  levelMessage.y = 0;
	  stage.addChild(levelMessage);
	}
  
	  //Create a new instance of Tink
	  tink = new Tink(PIXI, renderer.view);
	  var id = resources["images/button.json"].textures;
	  //The button state textures
	  var buttonFrames = [id["up.png"], id["over.png"], id["down.png"]];
	  //The `playButton`
	  var playButton = tink.button(buttonFrames, 32, (stage.height / 3) * 2);
	  playButton.x = renderer.view.width / 2 - playButton.width / 2;
	  gameOverScene.addChild(playButton);	//Add the button to the gameOverScene
	  playButton.press = function () { onPlay(); };

  //Capture the keyboard arrow keys
  var left = keyboard(37),
      up = keyboard(38),
      right = keyboard(39),
      down = keyboard(40);

  //Left arrow key `press` method
  left.press = function ()
  {
    //Play the sprite's `walkLeft` sequence and set the elf's velocity
    adventuress.playAnimation(adventuress.states.walkLeft);
    adventuress.vx = -5;
    adventuress.vy = 0;
  };

  //Left arrow key `release` method
  left.release = function () {

    //If the left arrow has been released, and the right arrow isn't down,
    //and the adventuress isn't moving vertically, stop the sprite from moving
    //by setting its velocity to zero
    if (!right.isDown && adventuress.vy === 0) {
      adventuress.vx = 0;
      adventuress.show(adventuress.states.left);
    }
  };

  //Up
  up.press = function () {
    adventuress.playAnimation(adventuress.states.walkUp);
    adventuress.vy = -5;
    adventuress.vx = 0;
  };
  up.release = function () {
    if (!down.isDown && adventuress.vx === 0) {
      adventuress.vy = 0;
      adventuress.show(adventuress.states.up);
    }
  };

  //Right
  right.press = function () {
    adventuress.playAnimation(adventuress.states.walkRight);
    adventuress.vx = 5;
    adventuress.vy = 0;
  };
  right.release = function () {
    if (!left.isDown && adventuress.vy === 0) {
      adventuress.vx = 0;
      adventuress.show(adventuress.states.right);
    }
  };

  //Down
  down.press = function () {
    adventuress.playAnimation(adventuress.states.walkDown);
    adventuress.vy = 5;
    adventuress.vx = 0;
  };
  down.release = function () {
    if (!up.isDown && adventuress.vx === 0) {
      adventuress.vy = 0;
      adventuress.show(adventuress.states.down);
    }
  };

  //Set the game's current state to `play`
  state = play;

  //Start the game loop
  gameLoop();
}

function gameLoop() {

  //Loop this function 60 times per second
  requestAnimationFrame(gameLoop);

  //Update the current game state:
  state();

  dust.update();	//Update the particles
  tink.update();
  
  //Render the stage
  renderer.render(stage);
}

function play() {

  //use the adventuress's velocity to make it move
  adventuress.x += adventuress.vx;
  adventuress.y += adventuress.vy;

  //Contain the adventuress inside the area of the dungeon
  contain(adventuress, { x: 28, y: 10, width: 904, height: 480 });

  //Set `adventuressHit` to `false` before checking for a collision
  var adventuressHit = false;

  //Loop through all the sprites in the `enemies` array
  blobs.forEach(function (blob)
  {
    //Move the blob
    blob.y += blob.vy;

    //Check the blob's screen boundaries
    var blobHitsWall = contain(blob, { x: 28, y: 10, width: 904, height: 480 });

    //If the blob hits the top or bottom of the stage, reverse
    //its direction
    if (blobHitsWall)
	{
      if (blobHitsWall.has("top") || blobHitsWall.has("bottom"))
	  {
        blob.vy *= -1;
      }
    }

    //Test for a collision. If any of the enemies are touching
    //the adventuress, set `adventuressHit` to `true`
    if (hitTestRectangle(adventuress, blob))
	{
      adventuressHit = true;
    }
  });

  //If the adventuress is hit...
  if (adventuressHit)
  {
    //Make the adventuress semi-transparent
    adventuress.alpha = 0.5;
	adventuress.x -= 19;
    //Reduce the width of the health bar's inner rectangle by 1 pixel
    healthBar.outer.width -= 9;
	showViaDust("images/heart.png", adventuress);
  }
  else
  {
    //Make the adventuress fully opaque (non-transparent) if it hasn't been hit
    adventuress.alpha = 1;
  }

  //Check for a collision between the adventuress and the treasure
  if (hitTestRectangle(adventuress, treasure)) {

    //If the treasure is touching the adventuress, center it over the adventuress
    treasure.x = adventuress.x + 8;
    treasure.y = adventuress.y + 8;
  }

  //Does the adventuress have enough health? If the width of the `innerBar`
  //is less than zero, end the game and display "You lost!"
  if (healthBar.outer.width < 0)
  {
    gameOverScene.won = false;
    state = end;
    message.text = "You lost!\nClick to try again:";
  }

  //If the adventuress has brought the treasure to the exit,
  //end the game and display "You won!"
  if (hitTestRectangle(treasure, door))
  {
    gameOverScene.won = true;
    state = end;
    message.text = "You won!\nStart the next level:";
  }
}

function end()
{
  gameScene.visible = true;
  gameOverScene.visible = true;
}

function onPlay()
{
  gameScene.visible = true;
  gameOverScene.visible = false;

  treasure.x = treasure.xOrg;
  treasure.y = treasure.yOrg;
  adventuress.x = adventuress.xOrg;
  adventuress.y = adventuress.yOrg;
  
  state = play;
  
  if(gameOverScene.won)
  {
	  makeBlob(blobs.length);
	  levelMessage.text = "Level " + ((blobs.length - numberOfBlobs) + 1);
  }
  else
  {
	healthBar.outer.width = healthBar.inner.width;
  }
  
  showViaDust(true, door, adventuress, treasure);
}

//The hitTestRectangle function
function hitTestRectangle(r1, r2)
{
  //Calculate `centerX` and `centerY` properties on the sprites
  r1.centerX = r1.x + r1.width / 2;
  r1.centerY = r1.y + r1.height / 2;
  r2.centerX = r2.x + r2.width / 2;
  r2.centerY = r2.y + r2.height / 2;

  //Calculate the `halfWidth` and `halfHeight` properties of the sprites
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;

  //Create a `collision` variable that will tell us
  //if a collision is occurring
  var collision = false;

  //Check whether the shapes of the sprites are overlapping. If they
  //are, set `collision` to `true`
  if (Math.abs(r1.centerX - r2.centerX) < r1.halfWidth + r2.halfWidth && Math.abs(r1.centerY - r2.centerY) < r1.halfHeight + r2.halfHeight) {
    collision = true;
  }

  //Return the value of `collision` back to the main program
  return collision;
}

//The `randomInt` helper function
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//The `keyboard` helper function
function keyboard(keyCode) {
  var key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = function (event) {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    event.preventDefault();
  };

  //The `upHandler`
  key.upHandler = function (event) {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
    event.preventDefault();
  };

  //Attach event listeners
  window.addEventListener("keydown", key.downHandler.bind(key), false);
  window.addEventListener("keyup", key.upHandler.bind(key), false);

  //Return the key object
  return key;
}

//The contain helper function
function contain(sprite, container) {

  //Create a set called `collision` to keep track of the
  //boundaries with which the sprite is colliding
  var collision = new Set();

  //Left
  if (sprite.x < container.x) {
    sprite.x = container.x;
    collision.add("left");
  }

  //Top
  if (sprite.y < container.y) {
    sprite.y = container.y;
    collision.add("top");
  }

  //Right
  if (sprite.x + sprite.width > container.width) {
    sprite.x = container.width - sprite.width;
    collision.add("right");
  }

  //Bottom
  if (sprite.y + sprite.height > container.height) {
    sprite.y = container.height - sprite.height;
    collision.add("bottom");
  }

  //If there were no collisions, set `collision` to `undefined`
  if (collision.size === 0) collision = undefined;

  //Return the `collision` value
  return collision;
}

function makeBlob(idx)
{
    //Make a blob
    var blob = su.sprite("blob.png");

    //Space each blob horizontally according to the `spacing` value.
    //`xOffset` determines the point from the left of the screen
    //at which the first blob should be added
    //var x = spacing * i + xOffset;
	var x =  randomInt(xOffset, stage.width - 148);

    //Give the blob a random y position
    var y = randomInt(0, stage.height - blob.height);

    //Set the blob's position
    blob.x = x;
    blob.y = y;

    //Set the blob's vertical velocity. `direction` will be either `1` or
    //`-1`. `1` means the enemy will move down and `-1` means the blob will
    //move up. Multiplying `direction` by `speed` determines the blob's
    //vertical direction
    blob.vy = speed * direction;

    //Reverse the direction for the next blob
    direction *= -1;

    //Push the blob into the `blobs` array
    blobs.push(blob);

    //Add the blob to the `gameScene`
    gameScene.addChild(blob);
}

function showViaDust()
{
	var img = arguments[0];
	var bSwitch = (img === true);
	
	for(var times = 0;times<3;times++)
	{
		for(var i=1;i<arguments.length;i++)
		{
			(function(o, i, times, img)				//Self-Executing Anonymous Function
			{
				var t = 500*(i+times-1);			//var t = (500*i)*(times*times);
				var imgs = ["images/star.png", "images/pink.png", "images/green.png"];
				img = bSwitch ? imgs[times] : img;
				setTimeout(function(){makeDust(img, o.x + o.width, o.y + o.height);}, t);
				
			})(arguments[i], i, times, img, bSwitch);
		}
	}
}
function makeDust(img, x, y)
{
	var stars = dust.create(x, y, function ()
	{
		return su.sprite(img ? img : "images/star.png");
	}, stage, 1000);
}

})();
