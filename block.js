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
  this.walls = walls,
  this.update = function (dt) {
    this.walls.forEach(function (wall) {
      wall.update(dt);
    })
  },
  this.draw = function (dt) {
    this.walls.forEach(function (wall) {
      wall.draw(dt);
    })
  }
}

function Wall (pos, size, color) {
  this.pos = pos,
  this.size = size,
  this.hole_position = getRandomInt(0, 200),
  this.color = color,
  this.vel = [-70, 0],
  this.originalsize = size,
  this.update = function (dt) {
    this.size[0] = this.snapback(this.originalsize[0], this.size[0]);
    this.size[1] = this.snapback(this.originalsize[1], this.size[1]);

    this.pos[0] += this.vel[0] * dt;
    this.pos[1] += this.vel[1] * dt;

    if (this.pos[0] < -100) {
      this.pos = [gCanvas.width, gCanvas.height];
      this.hole_position = getRandomInt(0, 200);
    }
  },
  this.draw = function (dt) {
    var drawpos = [this.pos[0], this.pos[1] - this.size[1]];
    drawRect(gContext, drawpos[0], 0, this.size[0], this.hole_position, this.color);
    drawRect(gContext, drawpos[0], this.hole_position + 200, this.size[0], this.size[1], this.color);
  },
  this.snapback = snapback
}

function Block (pos, size, color) {
  this.pos = pos,
  this.size = size,
  this.color = color,
  this.vel = [0, 0],
  this.originalsize = size,
  this.update = function (dt) {
    this.size[0] = this.snapback(this.originalsize[0], this.size[0]);
    this.size[1] = this.snapback(this.originalsize[1], this.size[1]);

    if (this.pos[1] < gCanvas.height) {
      this.vel[1] += 10;
    }

    this.pos[0] += this.vel[0] * dt;
    this.pos[1] += this.vel[1] * dt;

    if (this.pos[1] > gCanvas.height) {
      this.pos[1] = gCanvas.height;
      this.vel[1] = 0;
      this.squish();
    }

    if (this.pos[1] < 0) {
      this.pos[1] = 0;
      this.vel[1] = 0;
      this.squish();
    }
  },
  this.draw = function (dt) {
    var drawpos = [this.pos[0], this.pos[1] - this.size[1]];
    drawRect(gContext, drawpos[0], drawpos[1], this.size[0], this.size[1], this.color);
  },
  this.squish = function () {
    this.size = [this.size[0] * 1.5, this.size[1] * 0.5];
  },
  this.snapback = snapback
}

function Game() {
  this.stop_time = false,
  this.enter_wall = [],
  this.walls_count = 0,
  this.initBlock = function() {
    var pos = [gCanvas.width * 2 / 5, gCanvas.height * Math.random()];
    var size = [30, 40];
    return new Block(pos, size, 'red');
  },
  this.gBlock = this.initBlock(),
  this.initWall = function(shift) {
    var pos = [gCanvas.width + shift, gCanvas.height];
    var size = [100, gCanvas.height];
    var wall = new Wall(pos, size, 'green');
    return wall;
  },
  this.initWalls = function() {
    var wallsArray = [];
    for (var i = 0; i < 4; i++) {
      wallsArray.push(this.initWall(i * 200));
    }
    this.gBlock = this.initBlock();
    return new Walls(wallsArray);
  },
  this.gWalls = this.initWalls(),
  this.restart = function() {
    gContext.clearRect(0, 0, gCanvas.width, gCanvas.height);
    this.stop_time = false;
    this.walls_count = 0;
    setCounter(0);
    this.enter_wall = [];
    this.gWalls = this.initWalls();
  },
  this.draw = function() {
    gContext.fillStyle = "black";
    gContext.fillRect(0, 0, gCanvas.width, gCanvas.height);

    if (this.gWalls) {
      this.gWalls.draw();
    }

    if (this.gBlock) {
      this.gBlock.draw();
    }
  },
  this.checkCollision = function() {
    var wall_index = 0;
    var that = this;
    this.gWalls.walls.forEach(function (wall) {
      wall_index++;

      if (that.gBlock.pos[0] + that.gBlock.size[0] > wall.pos[0] && wall.pos[0] + wall.size[0] > that.gBlock.pos[0]) {
        if (wall.hole_position < that.gBlock.pos[1] - that.gBlock.size[1] && that.gBlock.pos[1] < wall.hole_position + 200) {
          that.enter_wall[wall_index] = true;
        } else {
          that.stop_time = true;

          var r = confirm("You passed " + that.walls_count + " walls! Play again?");
          if (r == true) {
              game.restart();
          } else {
              x = "Thank you for playing!";
          }

          return true;
        }


      } else {
        if (that.enter_wall[wall_index]) {
          that.walls_count++;
          setCounter(that.walls_count);
          that.enter_wall[wall_index] = false;
        }
      }
    })

    return false;
  },
  this.update = function() {
    this.gWalls.update(dt);
    this.gBlock.update(dt);

    this.checkCollision();
  }
}

var body = document.getElementsByTagName("body")[0];
body.addEventListener('mousedown', function () {
  game.gBlock["vel"][1] -= 300;
}, false);

body.addEventListener('touchstart', function () {
  game.gBlock["vel"][1] -= 300;
}, false);

var gCanvas = document.getElementById('gamecanvas');
var gContext = gCanvas.getContext('2d');
game = new Game();
game.restart();

var old_time = Date.now();
var gNewTime = null;

var mainloop = function () {
  new_time = Date.now();
  dt = (new_time - old_time) / 1000;
  old_time = new_time;

  if (game.stop_time == false) {
    game.update();
    game.draw();
  }
};

var frame_rate = 1000 / 60;
setInterval(mainloop, frame_rate);
