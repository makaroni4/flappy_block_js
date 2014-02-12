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

function checkCollision(walls, block) {
  var wall_index = 0;
  walls.walls.forEach(function (wall) {
    wall_index++;

    if (block.pos[0] + block.size[0] > wall.pos[0] && wall.pos[0] + wall.size[0] > block.pos[0]) {
      if (wall.hole_position < block.pos[1] - block.size[1] && block.pos[1] < wall.hole_position + 200) {
        enter_wall[wall_index] = true;
      } else {
        stop_time = true;

        var r = confirm("You hit " + walls_count + " walls! Play again?");
        if (r == true) {
            restartGame();
        } else {
            x = "You pressed Cancel!";
        }

        return true;
      }


    } else {
      if (enter_wall[wall_index]) {
        walls_count++;
        setCounter(walls_count);
        enter_wall[wall_index] = false;
      }
    }
  })

  return false;
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


Walls = {
  init: function (walls) {
    this.walls = walls;
  },
  update: function (dt) {
    this.walls.forEach(function (wall) {
      wall.update(dt);
    })
  },
  draw: function (dt) {
    this.walls.forEach(function (wall) {
      wall.draw(dt);
    })
  }
};

Wall = {
  init: function (pos, size, color) {
    this.pos = pos;
    this.size = size;
    this.hole_position = getRandomInt(0, 200);
    this.color = color;

    this.vel = [-70, 0];
    this.originalsize = size;
  },
  update: function (dt) {
    this.size[0] = this.snapback(this.originalsize[0], this.size[0]);
    this.size[1] = this.snapback(this.originalsize[1], this.size[1]);

    this.pos[0] += this.vel[0] * dt;
    this.pos[1] += this.vel[1] * dt;

    if (this.pos[0] < -100) {
      this.pos = [gCanvas.width, gCanvas.height];
      gWall.hole_position = getRandomInt(0, 200);
    }
  },
  draw: function (dt) {
    var drawpos = [this.pos[0], this.pos[1] - this.size[1]];
    drawRect(gContext, drawpos[0], 0, this.size[0], this.hole_position, this.color);
    drawRect(gContext, drawpos[0], this.hole_position + 200, this.size[0], this.size[1], this.color);
  },
  snapback: snapback
};

Block = {
  init: function (pos, size, color) {
    this.pos = pos;
    this.size = size;
    this.color = color;

    this.vel = [0, 0];
    this.originalsize = size;
  },
  update: function (dt) {
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
  draw: function (dt) {
    var drawpos = [this.pos[0], this.pos[1] - this.size[1]];
    drawRect(gContext, drawpos[0], drawpos[1], this.size[0], this.size[1], this.color);
  },
  squish: function () {
    this.size = [this.size[0] * 1.5, this.size[1] * 0.5];
  },
  snapback: snapback
};

var gCanvas = document.getElementById('gamecanvas');
var gContext = gCanvas.getContext('2d');

function initWall(shift) {
  var pos = [gCanvas.width + shift, gCanvas.height];
  var size = [100, gCanvas.height];
  var wall = Object.create(Wall);
  wall.init(pos, size, 'green');
  return wall;
}

function updateGame() {
  gWalls.update(dt);

  if (gBlock) {
    gBlock.update(dt);
  } else {
    var pos = [gCanvas.width * 2 / 5, gCanvas.height * Math.random()];
    var size = [30, 40];
    gBlock = Object.create(Block);
    gBlock.init(pos, size, 'red');
  }

  checkCollision(gWalls, gBlock);
}

var body = document.getElementsByTagName("body")[0];
body.addEventListener('click', function () {
  gBlock["vel"][1] -= 300;
}, false);

function drawGame() {
  gContext.fillStyle = "black";
  gContext.fillRect(0, 0, gCanvas.width, gCanvas.height);

  if (gWalls) {
    gWalls.draw();
  }

  if (gBlock) {
    gBlock.draw();
  }
}

function restartGame() {
  gContext.clearRect(0, 0, gCanvas.width, gCanvas.height);

  gBlock = null;
  gWall = null;
  gWalls = null;
  stop_time = false;
  walls_count = 0;
  enter_wall = [];

  wallsArray = []
  for (var i = 0; i < 4; i++) {
    wallsArray.push(initWall(i * 200));
  };
  gWalls = Object.create(Walls);
  gWalls.init(wallsArray);
  setCounter(walls_count);
}

restartGame();
var gOldTime = Date.now();
var gNewTime = null;

var mainloop = function () {
  gNewtime = Date.now();
  dt = (gNewtime - gOldTime) / 1000;
  gOldTime = gNewtime;

  if (stop_time == false) {
    updateGame();
    drawGame();
  }
};

var frame_rate = 1000 / 60;
setInterval(mainloop, frame_rate);
