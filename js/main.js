
//make the active and inactive canvas
let canvas = null
let ctx = null

let offscreenCanvas = null
let offscreenCtx = null

const board = init_board()

let square_size_x = null
let square_size_y = null
let grid_line_size = 1

const up = {x: 0, y: -1}
const down = {x: 0, y: 1}
const left = {x: -1, y: 0}
const right = {x: 1, y: 0}
const no_dir = {x: 0, y: 0}

let active = null
let piece_buffer = []
let piece_bag = []
let gravity_dir = down
let next_gravity_dir = down
let game_over = false
let gravity_interval_time = 2000
let gravity_interval_object = null
let clear_thresholds = []

window.onload = onLoaded;
document.addEventListener("keydown", handleKeyPress);

function onLoaded() {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");
  offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = canvas.width;
  offscreenCanvas.height = canvas.height;
  offscreenCtx = offscreenCanvas.getContext("2d");

  square_size_x = offscreenCanvas.width / 20
  square_size_y = offscreenCanvas.height / 20

  for (var i = 0; i < canvas.width / square_size_x; i++) {
    clear_thresholds[i] = 0
  }

  active = get_next_piece()
  active.move({x: 0, y: 0}, 0)

  gravity_interval_object = window.setInterval(doGravity, gravity_interval_time);
  
  active.get_cow_rot()
  console.log(pretty_print_board())
  console.log(pretty_print_quadrant())
}



function handleKeyPress(event) {
  if (game_over) {
    return
  }
  var dir = no_dir
  var rot = 0;
  switch (event.key) {
    case "ArrowUp":
      dir = up
      break;
    case "ArrowDown":
      dir = down
      break;
    case "ArrowLeft":
      dir = left
      break;
    case "ArrowRight":
      dir = right
      break;
    case "z":
      rot = -1
      break;
    case "x":
      rot = 1
      break;
    case "p":
      clearInterval(gravity_interval_object)
      return
    case " ":
      active.drop()
      return
  }

  if (opposite_dir(dir) == gravity_dir) {
    return
  }
  else if (dir != gravity_dir && dir != no_dir) {
    next_gravity_dir = dir
  }
  active.move(dir, rot)
}

function opposite_dir(dir) {
  switch (dir) {
    case up:
      return down
    case down:
      return up
    case left:
      return right
    case right:
      return left
    case no_dir:
      return no_dir
  }
  console.log("ERROR BAD DIR TO OPPOSE")
}


class Tetromino {
  constructor(color, rotation, center) {
    this.color = color
    this.rotation = rotation
    this.center = center
    this.blocks = this.get_blocks(this.center, this.rotation);
  }

  get_cow_rot() {
    console.log("*zombie like* Moooooooooo")
  }

  get_blocks(center, rotation) {
    var offset = this.get_offset(rotation)
    var blocks = []
    for (var i = 0; i < 4; i++) {
      blocks[i] = {x: center.x + offset[i].x, y: center.y + offset[i].y}
    }

    return blocks
  }

  drop() {
    while (this.move(gravity_dir, 0)) {
    }
  }

  move(dir, rotation_dir) {
    var new_center = {x: this.center.x + dir.x, y: this.center.y + dir.y}
    var new_rotation = this.normalize_rotation(this.rotation + rotation_dir)
    var new_blocks = this.get_blocks(new_center, new_rotation)

    if (!this.is_obstructed(new_blocks)) {
      set_board(0, this.blocks)
      this.center = new_center
      this.rotation = new_rotation
      this.blocks = new_blocks
      set_board(-1 * this.color, this.blocks)
      render_board()
      return true
    }
    else if (dir == gravity_dir) {
      place_tetromino()
      return false
    }
    return true
  }

  find_drop() {
    var old_blocks = this.blocks
    var new_blocks = this.blocks
    var center = this.center
    while (!this.is_obstructed(new_blocks)) {
      old_blocks = new_blocks
      center = {x: center.x + gravity_dir.x, y: center.y + gravity_dir.y}
      new_blocks = this.get_blocks(center, this.rotation)
    }
    return old_blocks
  }

  is_obstructed(blocks) {
    for (var i = 0; i < 4; i++) {
      if (blocks[i].x < 0 || blocks[i].x >= 20 || blocks[i].y < 0 || blocks[i].y >= 20) {
        //console.log("out of bound")
        return true
      }
      if (board[blocks[i].y][blocks[i].x] > 0) {
        //console.log("trash collision")
        return true
      }
    }

    return false
  }
    

  normalize_rotation(rotation) {
    var result = rotation;
    while (result > 3) {
      result += -4
    }
    while (result < 0) {
      result += 4
    }

    return result
  }

  get_offset(rotation) {
    console.log("ERROR: generic tetromino offset called")
  }

}

function doGravity() {
  active.move(gravity_dir, 0)
}

function place_tetromino() {
  clearInterval(gravity_interval_object)
  set_board(active.color, active.blocks)
  update_clear_thresholds(active.blocks)
  if (clear_thresholds[8] > 0 || clear_thresholds[9] > 0) {
    game_over = true
  }
  check_for_full_lines()
  gravity_dir = next_gravity_dir
  active = get_next_piece()
  active.move({x: 0, y: 0}, 0)
  gravity_interval_object = window.setInterval(doGravity, gravity_interval_time);
}


function set_board(color, blocks) {
  for (var i = 0; i < 4; i++) {
    board[blocks[i].y][blocks[i].x] = color
  }
}

function check_for_full_lines() {
  var lines_to_clear = []
  for (var i = 0; i < 8; i++) {
    if (clear_thresholds[i] == (19 - (i * 2)) * 4) {
      lines_to_clear.push(i)
    }
  }
  if (lines_to_clear.length > 0) {
    clear_lines(lines_to_clear)
  }
}

function update_clear_thresholds(blocks) {
  for (var i = 0; i < 4; i++) {
    clear_thresholds[calc_displacement(blocks[i])] += 1
  }
  console.log(clear_thresholds)
}

function calc_displacement(block) {
  var x = Math.abs((Math.abs(10 * block.x - 95) + 5) / 10 - 10)
  var y = Math.abs((Math.abs(10 * block.y - 95) + 5) / 10 - 10)
  if (x < y) {
    return x
  }
  return y
}

function calc_quadrant(block) {
  var quadrant = 0
  if (block.y > block.x || (block.y > 9 && block.y == block.x)) {
    quadrant += 2
  }
  if (block.x + block.y > 19 || (block.y < 10 && block.x + block.y >= 19)) {
    quadrant += 1
  }
  return quadrant
}

function clear_lines(lines) {
  console.log(lines)
  for (var i = lines[0]; i < 8; i++) {
    clear_thresholds[i] = 0
    for (var block_x = i; block_x < 19 - i; block_x++) {
      var moving_block = {x: block_x, y: i + lines.length}
      var new_value = 0

      if (calc_quadrant(moving_block) == 0) {
        new_value = board[moving_block.y][moving_block.x]
      }

      board[i][block_x] = new_value
      if (new_value != 0) {
        clear_thresholds[i] += 1
      }
    }

    for (var block_y = i + 1; block_y <= 19 - i; block_y++) {
      var moving_block = {x: i + lines.length, y: block_y}
      var new_value = 0

      if (calc_quadrant(moving_block) == 2) {
        new_value = board[moving_block.y][moving_block.x]
      }

      board[block_y][i] = new_value
      if (new_value != 0) {
        clear_thresholds[i] += 1
      }
    }

    for (var block_x = i + 1; block_x <= 19 - i; block_x++) {
      var moving_block = {x: block_x, y: 19 - (i + lines.length)}
      var new_value = 0

      if (calc_quadrant(moving_block) == 3) {
        new_value = board[moving_block.y][moving_block.x]
      }

      board[19 - i][block_x] = new_value
      if (new_value != 0) {
        clear_thresholds[i] += 1
      }
    }

    for (var block_y = i; block_y < 19 - i; block_y++) {
      var moving_block = {x: 19 - (i + lines.length), y: block_y}
      var new_value = 0

      if (calc_quadrant(moving_block) == 1) {
        new_value = board[moving_block.y][moving_block.x]
      }

      board[block_y][19 - i] = new_value
      if (new_value != 0) {
        clear_thresholds[i] += 1
      }
    }
    render_board()
  }
}

function get_next_piece() {
  
  while (piece_buffer.length < 4) {
    if (piece_bag.length == 0) {
      piece_bag[0] = new I(1, 0, {x: 10, y: 10})
      piece_bag[1] = new J(2, 0, {x: 10, y: 10})
      piece_bag[2] = new L(3, 0, {x: 10, y: 10})
      piece_bag[3] = new O(4, 0, {x: 10, y: 10})
      piece_bag[4] = new S(5, 0, {x: 10, y: 10})
      piece_bag[5] = new T(6, 0, {x: 10, y: 10})
      piece_bag[6] = new Z(7, 0, {x: 10, y: 10})
    }
    piece_buffer.push(
      piece_bag.splice(Math.floor(Math.random() * piece_bag.length, 1))[0])
  }
  return piece_buffer.splice(0, 1)[0];
  
}


function pretty_print_board() {
  string = ""
  for (var y = 0; y < 20; y++) {
    for (var x = 0; x < 20; x++) {
      string = string + board[y][x] + " "
    }
    string = string + "\n"
  }

  return string
}

function pretty_print_quadrant() {
  string = ""
  for (var y = 0; y < 20; y++) {
    for (var x = 0; x < 20; x++) {
      string = string + calc_quadrant({x: x, y: y}) + " "
    }
    string = string + "\n"
  }

  return string
}

function init_board() {
  var arr = []

  for(var y = 0; y < 20; y++) {
    arr[y] = []
    for (var x = 0; x < 20; x++) {
      arr[y][x] = 0
    }
  }

  return arr
}

function render_board() {
  offscreenCtx.fillStyle = "midnightblue"
  offscreenCtx.fillRect(0, 0, canvas.width, canvas.height)
  offscreenCtx.fillStyle = "white"
  offscreenCtx.fillRect(square_size_x * 8, square_size_y * 8, square_size_x * 4, square_size_y * 4)
  if (active != null) {
    offscreenCtx.fillStyle = get_color(active.color)
    var drop_blocks = active.find_drop()
    for (var i = 0; i < 4; i++) {
      offscreenCtx.fillRect(square_size_x * drop_blocks[i].x, square_size_y * drop_blocks[i].y, square_size_x, square_size_y)
    }
  }
  for (var board_y = 0; board_y < 20; board_y++) {
    for (var board_x = 0; board_x < 20; board_x++) {
      switch (Math.abs(board[board_y][board_x])) {
        case 1:
          offscreenCtx.fillStyle = "teal"
          break;
        case 2:
          offscreenCtx.fillStyle = "blue"
          break;
        case 3:
          offscreenCtx.fillStyle = "orange"
          break;
        case 4:
          offscreenCtx.fillStyle = "yellow"
          break
        case 5:
          offscreenCtx.fillStyle = "green"
          break;
        case 6:
          offscreenCtx.fillStyle = "purple"
          break;
        case 7:
          offscreenCtx.fillStyle = "red"
          break;
        default:
          if (board_x >= 8 && board_x < 12 && board_y >= 8 && board_y < 12) {
            offscreenCtx.fillStyle = "white"
          }
          else {
            offscreenCtx.fillStyle = "black"
          }
          break;
      }

      offscreenCtx.fillRect(board_x * square_size_x + grid_line_size, board_y * square_size_y + grid_line_size, square_size_x - (2*grid_line_size), square_size_y - (2*grid_line_size))
    }
  }
  
offscreenCtx.fillStyle = "purple";
offscreenCtx.strokeStyle = "purple"; // Set stroke color to purple
offscreenCtx.lineWidth = 3; // Adjust line width as needed

switch (gravity_dir) {
  case up:
    // Draw an up-pointing arrow
    const centerXUp = (board_x / 2) * square_size_x;
    const centerYUp = (board_y * square_size_y) / 4;
    offscreenCtx.beginPath();
    offscreenCtx.moveTo(centerXUp, centerYUp - square_size_x / 2);
    offscreenCtx.lineTo(centerXUp - square_size_x / 2, centerYUp + square_size_x / 2);
    offscreenCtx.lineTo(centerXUp + square_size_x / 2, centerYUp + square_size_x / 2);
    offscreenCtx.closePath();
    offscreenCtx.fill();
    offscreenCtx.stroke();
    break;
  case down:
    // Draw a down-pointing arrow
    const centerXDown = (board_x / 2) * square_size_x;
    const centerYDown = ((board_y * square_size_y) * 3) / 4;
    offscreenCtx.beginPath();
    offscreenCtx.moveTo(centerXDown, centerYDown + square_size_x / 2);
    offscreenCtx.lineTo(centerXDown - square_size_x / 2, centerYDown - square_size_x / 2);
    offscreenCtx.lineTo(centerXDown + square_size_x / 2, centerYDown - square_size_x / 2);
    offscreenCtx.closePath();
    offscreenCtx.fill();
    offscreenCtx.stroke();
    break;
  case left:
    // Draw a left-pointing arrow
    const centerXLeft = (board_x * square_size_x) / 4;
    const centerYLeft = board_y * square_size_y / 2;
    offscreenCtx.beginPath();
    offscreenCtx.moveTo(centerXLeft + square_size_x / 2, centerYLeft);
    offscreenCtx.lineTo(centerXLeft - square_size_x / 2, centerYLeft - square_size_x / 2);
    offscreenCtx.lineTo(centerXLeft - square_size_x / 2, centerYLeft + square_size_x / 2);
    offscreenCtx.closePath();
    offscreenCtx.fill();
    offscreenCtx.stroke();
    break;
  case right:
    // Draw a right-pointing arrow
    const centerXRight = (board_x * square_size_x) * 3 / 4;
    const centerYRight = board_y * square_size_y / 2;
    offscreenCtx.beginPath();
    offscreenCtx.moveTo(centerXRight - square_size_x / 2, centerYRight);
    offscreenCtx.lineTo(centerXRight + square_size_x / 2, centerYRight - square_size_x / 2);
    offscreenCtx.lineTo(centerXRight + square_size_x / 2, centerYRight + square_size_x / 2);
    offscreenCtx.closePath();
    offscreenCtx.fill();
    offscreenCtx.stroke();
    break;
}


  ctx.drawImage(offscreenCanvas, 0, 0)
}

function get_color(int) {
  switch (int) {
        case 1:
          return "teal"
        case 2:
          return "blue"
        case 3:
          return "orange"
        case 4:
          return "yellow"
        case 5:
          return "green"
        case 6:
          return "purple"
        case 7:
          return "red"
        default:
          return "black"
  }
}


class I extends Tetromino {
  constructor(color, rotation, center) {
    super(color, rotation, center)
  }

  get_offset(rotation) {
    switch(rotation) {
      case 0:
        return [{x: -2, y: -1}, {x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1}]
      case 1:
        return [{x: 0, y: -2}, {x: 0, y: -1}, {x: 0, y: 0}, {x: 0, y: 1}]
      case 2:
        return [{x: -2, y: 0}, {x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}]
      case 3:
        return [{x: -1, y: -2}, {x: -1, y: -1}, {x: -1, y: 0}, {x: -1, y: 1}]
    }
  }
}

class J extends Tetromino {
  constructor(color, rotation, center) {
    super(color, rotation, center)
  }

  get_offset(rotation) {
    switch(rotation) {
      case 0:
        return [{x: -1, y: -1}, {x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}]
      case 1:
        return [{x: 0, y: -1}, {x: 1, y: -1}, {x: 0, y: 0}, {x: 0, y: 1}]
      case 2:
        return [{x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}]
      case 3:
        return [{x: 0, y: -1}, {x: 0, y: 0}, {x: -1, y: 1}, {x: 0, y: 1}]
    }
  }
}

class L extends Tetromino {
  constructor(color, rotation, center) {
    super(color, rotation, center)
  }

  get_offset(rotation) {
    switch(rotation) {
      case 0:
        return [{x: 1, y: -1}, {x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}]
      case 1:
        return [{x: 0, y: -1}, {x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}]
      case 2:
        return [{x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}, {x: -1, y: 1}]
      case 3:
        return [{x: -1, y: -1}, {x: 0, y: -1}, {x: 0, y: 0}, {x: 0, y: 1}]
    }
  }
}

class O extends Tetromino {
  constructor(color, rotation, center) {
    super(color, rotation, center)
  }

  get_offset(rotation) {
    switch(rotation) {
      case 0:
        return [{x: -1, y: -1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 0, y: 0}]
      case 1:
        return [{x: -1, y: -1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 0, y: 0}]
      case 2:
        return [{x: -1, y: -1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 0, y: 0}]
      case 3:
        return [{x: -1, y: -1}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 0, y: 0}]

    }
  }
}

class S extends Tetromino {
  constructor(color, rotation, center) {
    super(color, rotation, center)
  }

  get_offset(rotation) {
    switch(rotation) {
      case 0:
        return [{x: 0, y: -1}, {x: 1, y: -1}, {x: -1, y: 0}, {x: 0, y: 0}]
      case 1:
        return [{x: 0, y: -1}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}]
      case 2:
        return [{x: 0, y: 0}, {x: 1, y: 0}, {x: -1, y: 1}, {x: 0, y: 1}]
      case 3:
        return [{x: -1, y: -1}, {x: -1, y: 0}, {x: 0, y: 0}, {x: 0, y: 1}]
    }
  }
}

class T extends Tetromino {
  constructor(color, rotation, center) {
    super(color, rotation, center)
  }

  get_offset(rotation) {
    switch(rotation) {
      case 0:
        return [{x: 0, y: -1}, {x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}]
      case 1:
        return [{x: 0, y: -1}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}]
      case 2:
        return [{x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}]
      case 3:
        return [{x: 0, y: -1}, {x: -1, y: 0}, {x: 0, y: 0}, {x: 0, y: 1}]
    }
  }
}

class Z extends Tetromino {
  constructor(color, rotation, center) {
    super(color, rotation, center)
  }

  get_offset(rotation) {
    switch(rotation) {
      case 0:
        return [{x: -1, y: -1}, {x: 0, y: -1}, {x: 0, y: 0}, {x: 1, y: 0}]
      case 1:
        return [{x: 1, y: -1}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}]
      case 2:
        return [{x: -1, y: 0}, {x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}]
      case 3:
        return [{x: 0, y: -1}, {x: -1, y: 0}, {x: 0, y: 0}, {x: -1, y: 1}]
    }
  }
}

