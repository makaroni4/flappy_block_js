// https://gist.github.com/paulirish/1579671
(function() {
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = config.frame_rate;
      var id = window.setTimeout(function() { callback(currTime + timeToCall); },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    };
}());

// Array.prototype.findIndex - MIT License (c) 2013 Paul Miller <http://paulmillr.com>
// For all details and docs: <https://github.com/paulmillr/Array.prototype.findIndex>
(function(globals){
  var findIndex = function(predicate) {
    var list = Object(this);
    var length = list.length >>> 0; // ES.ToUint32;
    if (length === 0) return -1;
    if (typeof predicate !== 'function') {
      throw new TypeError('Array#findIndex: predicate must be a function');
    }
    var thisArg = arguments.length > 1 ? arguments[1] : undefined;
    for (var i = 0; i < length && i in list; i++) {
      if (predicate.call(thisArg, list[i], i, list)) return i;
    }
    return -1;
  };

  if (Object.defineProperty) {
    try {
      Object.defineProperty(Array.prototype, 'findIndex', {
        value: findIndex, configurable: true, writable: true
      });
    } catch(e) {}
  }

  if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = findIndex;
  }
})(this);

function drawRect(context, x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setCounter(count) {
  var walls_counter = document.getElementById('walls_count');
  walls_counter.innerHTML = count;
}

function snapback(original, current) {
  if (Math.abs(original - current) <= 2) {
    return current;
  }

  if (current < original) {
    return current * 1.05;
  } else {
    return current * 0.95;
  }
}

function Walls(walls) {
  this.walls = walls;
}

Walls.prototype.update = function (dt) {
  this.walls.forEach(function (wall) {
    wall.update(dt);
  })
}

Walls.prototype.draw = function (dt) {
  this.walls.forEach(function (wall) {
    wall.draw(dt);
  })
}

function Wall (pos, size, color, speed) {
  this.pos = pos;
  this.size = size;
  this.hole_position = getRandomInt(20, 200);
  this.color = color;
  this.vel = [speed, 0];
  this.original_size = size;
  this.snapback = snapback;
}

Wall.prototype.update = function (dt) {
  this.size[0] = this.snapback(this.original_size[0], this.size[0]);
  this.size[1] = this.snapback(this.original_size[1], this.size[1]);

  this.pos[0] += this.vel[0] * dt;
  this.pos[1] += this.vel[1] * dt;

  if (this.pos[0] < -100) {
    this.pos = [game.canvas.width, game.canvas.height];
    this.hole_position = getRandomInt(0, 200);
  }
}

Wall.prototype.draw = function (dt) {
  var drawpos = [this.pos[0], this.pos[1] - this.size[1]];
  drawRect(game.context, drawpos[0], 0, this.size[0], this.hole_position, this.color);
  drawRect(game.context, drawpos[0], this.hole_position + game.config.wall_hole_size, this.size[0], this.size[1], this.color);
}

function Block (pos, size, color) {
  this.pos = pos;
  this.size = size;
  this.color = color;
  this.vel = [0, 0];
  this.original_size = size;
  this.snapback = snapback;
}

Block.prototype.update = function (dt) {
  this.size[0] = this.snapback(this.original_size[0], this.size[0]);
  this.size[1] = this.snapback(this.original_size[1], this.size[1]);

  if (this.pos[1] < game.canvas.height) {
    this.vel[1] += game.config.free_fall_acceleration;
  }

  this.pos[0] += this.vel[0] * dt;
  this.pos[1] += this.vel[1] * dt;

  if (this.pos[1] > game.canvas.height) {
    this.pos[1] = game.canvas.height;
    this.vel[1] = 0;
    this.squish();
  }

  if (this.pos[1] < 0) {
    this.pos[1] = 0;
    this.vel[1] = 0;
    this.squish();
  }
}

Block.prototype.draw = function (dt) {
  var drawpos = [this.pos[0], this.pos[1] - this.size[1]];
  drawRect(game.context, drawpos[0], drawpos[1], this.size[0], this.size[1], this.color);
}

Block.prototype.squish = function () {
  this.size = [this.size[0] * 1.5, this.size[1] * 0.5];
}

function Game(canvas, config) {
  this.canvas = canvas;
  this.config = config;
  this.context = this.canvas.getContext('2d');
  this.stop_time = false;
  this.enter_wall = [];
  this.walls_count = 0;
  this.current_wall_index = -1;
  this.block = this.initBlock();
  this.walls = this.initWalls();
}

Game.prototype.initBlock = function() {
  var pos = [this.config.init_block_x, this.canvas.height * Math.random()];
  var size = this.config.block_size;
  return new Block(pos, size, 'red');
}

Game.prototype.initWall = function(shift) {
  var pos = [this.canvas.width + shift, this.canvas.height];
  var size = this.config.wall_size;
  var wall = new Wall(pos, size, 'green', this.config.wall_speed);
  return wall;
}

Game.prototype.initWalls = function() {
  var wallsArray = [];
  // TODO there should not be 4
  // it is a function of window width and wall width
  for (var i = 0; i < 4; i++) {
    wallsArray.push(this.initWall(i * this.config.wall_gap));
  }
  this.block = this.initBlock();
  return new Walls(wallsArray);
}

Game.prototype.restart = function() {
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.stop_time = false;
  this.walls_count = 0;
  this.current_wall_index = -1;
  setCounter(0);
  this.enter_wall = [];
  this.walls = this.initWalls();
}

Game.prototype.draw = function() {
  this.context.fillStyle = "black";
  this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

  if (this.walls) {
    this.walls.draw();
  }

  if (this.block) {
    this.block.draw();
  }
}

Game.prototype.askToPlayAgain = function() {
  var answer = confirm("You passed " + this.walls_count + " walls! Play again?");
  if (answer) {
    game.restart();
  }
}

Game.prototype.currentWall = function() {
  var that = this;
  return this.walls.walls.findIndex(function (wall) {
     return that.block.pos[0] + that.block.size[0] > wall.pos[0] && wall.pos[0] + wall.size[0] > that.block.pos[0];
  });
}

Game.prototype.checkCollision = function(wall_index) {
  var wall = this.walls.walls[wall_index];
  return !(wall.hole_position < this.block.pos[1] - this.block.size[1] &&
    this.block.pos[1] < wall.hole_position + 200);
}

Game.prototype.checkWallPassed = function() {
  var wall_index = this.currentWall();
  if(wall_index > -1 && this.current_wall_index != wall_index) {
    this.walls_count++;
  }
  this.current_wall_index = wall_index;
}

Game.prototype.update = function() {
  this.walls.update(dt);
  this.block.update(dt);
  this.checkWallPassed();

  if(this.current_wall_index > -1 && this.checkCollision(this.current_wall_index)) {
    this.stop_time = true;
    this.askToPlayAgain();
  }

  setCounter(this.walls_count);
}

function flapBlock() {
  game.block["vel"][1] -= game.config.flap_speed_gain;
}

document.body.addEventListener('mousedown', flapBlock, false);
document.body.addEventListener('touchstart', flapBlock, false);

var canvas = document.getElementById('gamecanvas');
var config = {};
config.block_size = [30, 40];
config.init_block_x = canvas.width * 2 / 5;

config.wall_size = [100, canvas.height];
config.wall_gap = 200;
config.wall_speed = -70;
config.wall_hole_size = 200;

config.free_fall_acceleration = 10;
config.flap_speed_gain = 300;
config.frame_rate = 1000 / 60

game = new Game(canvas, config);
game.restart();

var old_time = Date.now();
var gNewTime = null;

var gameloop = function () {
  new_time = Date.now();
  dt = (new_time - old_time) / 1000;
  old_time = new_time;

  if (game.stop_time == false) {
    game.update();
    game.draw();
  }
};

(function animatino_loop(){
  requestAnimationFrame(animatino_loop);
  gameloop();
})();
