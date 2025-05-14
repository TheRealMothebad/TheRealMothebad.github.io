
//make the active and inactive canvas
let canvas = null
let ctx = null

let offscreenCanvas = null
let offscreenCtx = null

let board_width = 18
let board_height = 18

const board = init_board()
/*
const board = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, ],
               [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, ]]
*/

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
let disable_inputs = false
let gravity_interval_time = 800
let gravity_interval_object = null

window.onload = onLoaded;
document.addEventListener("keydown", handleKeyPress);

function onLoaded() {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");
  offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = canvas.width;
  offscreenCanvas.height = canvas.height;
  offscreenCtx = offscreenCanvas.getContext("2d");

  square_size_x = offscreenCanvas.width / board_width 
  square_size_y = offscreenCanvas.height / board_height

  active = get_next_piece()
  active.move({x: 0, y: 0}, 0)

  gravity_interval_object = window.setInterval(doGravity, gravity_interval_time);
  
  active.get_cow_rot()
  console.log(pretty_print_board())
}



function handleKeyPress(event) {
  if (disable_inputs) {
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
    while (this.move(gravity_dir, 0)) {}
  }

  move(dir, rotation_dir) {
    var new_center = {x: this.center.x + dir.x, y: this.center.y + dir.y}
    var new_rotation = this.normalize_rotation(this.rotation + rotation_dir)
    var new_blocks = this.get_blocks(new_center, new_rotation)
    
    if (this.is_obstructed(this.get_blocks({x: this.center.x + gravity_dir.x, y: this.center.y + gravity_dir.y}, this.rotation))) {
      console.log("resetting gravity interval")
      clearInterval(gravity_interval_object)
      gravity_interval_object = window.setInterval(doGravity, gravity_interval_time)
    }

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
      if (blocks[i].x < 0 || blocks[i].x >= board_width || blocks[i].y < 0 || blocks[i].y >= board_height) {
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
  for (var y = board_height / 2 - 2; y < board_height / 2 + 2; y++) {
    for (var x = board_width / 2 - 2; x < board_height / 2 + 2; x++) {
      if (board[y][x] != 0) {
        console.log("game over detected")
        game_over()
        return
      }
    }
  }
  check_for_full_lines(active.blocks)
}


function set_board(color, blocks) {
  for (var i = 0; i < 4; i++) {
    board[blocks[i].y][blocks[i].x] = color
  }
}


function check_for_full_lines(blocks) {
  console.log("starting full line check")
  var vert_lines_to_check = []
  for (var i = 0; i < 4; i++) {
    if (vert_lines_to_check.indexOf(blocks[i].x) == -1) {
      vert_lines_to_check.push(blocks[i].x)
    }
  }
  var horiz_lines_to_check = []
  for (var i = 0; i < 4; i++) {
    if (horiz_lines_to_check.indexOf(blocks[i].y) == -1) {
      horiz_lines_to_check.push(blocks[i].y)
    }
  }
  console.log("vert lines")
  console.log(vert_lines_to_check)
  console.log("horiz lines")
  console.log(horiz_lines_to_check)
  
  
  var horiz_full_lines = []
  for (var i = 0; i < horiz_lines_to_check.length; i++) {
    if (check_line("y", horiz_lines_to_check[i])) {
      horiz_full_lines.push(horiz_lines_to_check[i]);
    }
  }
  console.log("y full lines")
  console.log(horiz_full_lines)
  if (horiz_full_lines.length > 0) {
    if (horiz_full_lines[0] < board_height / 2) {
      var horiz_min_full = Math.min(...horiz_full_lines)
      clear_lines(horiz_min_full, horiz_full_lines.length, down)
    }
    else {
      var horiz_max_full = Math.max(...horiz_full_lines)
      clear_lines(horiz_max_full, horiz_full_lines.length, up)
    }
    return
  }


  var vert_full_lines = []
  for (var i = 0; i < vert_lines_to_check.length; i++) {
    if (check_line("x", vert_lines_to_check[i])) {
      vert_full_lines.push(vert_lines_to_check[i]);
    }
  }
  console.log("x full lines")
  console.log(vert_full_lines)
  if (vert_full_lines.length > 0) {
    if (vert_full_lines[0] < board_width / 2) {
      var vert_min_full = Math.min(...vert_full_lines)
      clear_lines(vert_min_full, vert_full_lines.length, right)
    }
    else {
      var vert_max_full = Math.max(...vert_full_lines)
      clear_lines(vert_max_full, vert_full_lines.length, left)
    } 
    return
  }
  console.log("no full lines")
  gravity_dir = next_gravity_dir
  active = get_next_piece()
  active.move({x: 0, y: 0}, 0)
  gravity_interval_object = window.setInterval(doGravity, gravity_interval_time);
}

function check_line(alignment, line_num) {
  if (alignment == "y") {
    for (var x = 0; x < board_width; x++) {
      if (board[line_num][x] == 0) {
        return false
      }
    }
    return true
  }
  if (alignment == "x") {
  for (var y = 0; y < board_height; y++) {
      if (board[y][line_num] == 0) {
        return false
      }
    }
    return true
  }
}

function clear_lines(start_line, length, dir) {
  console.log("we be clearing some lines!")
  disable_inputs = true

  switch (dir) {
    case up:
      for (var y = start_line; y > start_line - length; y--) {
        for (var x = 0; x < board_width; x++) {
          board[y][x] = 0
        }
      }
      break;
    case down:
      for (var y = start_line; y < start_line + length; y++) {
        for (var x = 0; x < board_height; x++) {
          board[y][x] = 0
        }
      }
    case left:
      for (var x = start_line; x > start_line - length; x--) {
        for (var y = 0; y < board_height; y++) {
          board[y][x] = 0
        }
      }
    case right:
      for (var x = start_line; x < start_line + length; x++) {
        for (var y = 0; y < board_width; y++) {
          board[y][x] = 0
        }
      }
      break;
  }

  var whiteout_line_timeout = setTimeout(whiteout_line, 5, start_line, length, dir, 0); 
}

function whiteout_line(start_line, length, dir, progress) {
  offscreenCtx.fillStyle = "white"
  switch (dir) {
    case up:
      offscreenCtx.fillRect(progress * square_size_x, (start_line - length + 1) * square_size_y, square_size_x, length * square_size_y)
      break;
    case down:
      offscreenCtx.fillRect((board_width - 1 - progress) * square_size_x, start_line * square_size_y, square_size_x, length * square_size_y)
    case left:
      offscreenCtx.fillRect((start_line - length + 1) * square_size_x, (board_height - 1 - progress) * square_size_y, length * square_size_x, square_size_y)
    case right:
      offscreenCtx.fillRect(start_line * square_size_x, progress * square_size_y, length * square_size_x, square_size_y)
      break;
  }

  ctx.drawImage(offscreenCanvas, 0, 0)
  //TODO: DOES NOT CORRECTLY HANDLE RECTANGLE BOARD
  if (progress == board_width - 1) {
    setTimeout(() => {
      render_board()
      console.log("actually boutta shift!")
      setTimeout(line_shift, 40, start_line, length, dir, 0)
    }, 20);
  }
  else {
    setTimeout(whiteout_line, 10, start_line, length, dir, progress + 1)
  }
}

function line_shift(start_line, length, dir, progress) {
  console.log("line shifting with start line: " + start_line)
  switch (dir) {
    case up:
      console.log("shift case up")
      for (var x = 0; x < board_width; x++) {
        source_block = {x: x, y: start_line - length - progress}
        console.log(source_block)

        if (source_block.y > board_height / 2 - 1) {
          board[start_line - progress][x] = board[source_block.y][source_block.x]
          board[source_block.y][source_block.x] = 0
        }
        else {
          board[start_line - progress][x] = 0
        }
      }

      render_board()
      if (start_line - progress > board_height / 2) {
        setTimeout(line_shift, 40, start_line, length, dir, progress + 1)
        return
      }
      break;
    case down:
      console.log("shift case down")
      for (var x = 0; x < board_width; x++) {
        source_block = {x: x, y: start_line + length + progress}

        if (source_block.y < 10) {
          board[start_line + progress][x] = board[source_block.y][source_block.x]
          board[source_block.y][source_block.x] = 0
        }
        else {
          board[start_line + progress][x] = 0
        }
      }
      
      render_board()
      if (start_line + progress < board_height / 2 - 1) {
        setTimeout(line_shift, 40, start_line, length, dir, progress + 1)
        return
      }
      break;
    case left:
      console.log("shift case left")
      for (var y = 0; y < board_height; y++) {
        source_block = {x: start_line - length - progress, y: y}

        if (source_block.x > 9) {
          board[y][start_line - progress] = board[source_block.y][source_block.x]
          board[source_block.y][source_block.x] = 0
        }
        else {
          board[y][start_line - progress] = 0
        }
      }
      
      render_board()
      if (start_line - progress > board_width / 2) {
        setTimeout(line_shift, 40, start_line, length, dir, progress + 1)
        return
      }
      break;
    case right:
      console.log("shift case right")
      for (var y = 0; y < board_height; y++) {
        source_block = {x: start_line + length + progress, y: y}

        if (source_block.x < board_width / 2) {
          board[y][start_line + progress] = board[source_block.y][source_block.x]
          board[source_block.y][source_block.x] = 0
        }
        else {
          board[y][start_line + progress] = 0
        }
      }
      
      render_board()
      if (start_line + progress < board_width / 2 - 1) {
        setTimeout(line_shift, 40, start_line, length, dir, progress + 1)
        return
      }
      break;
  }
  gravity_dir = next_gravity_dir
  active = get_next_piece()
  active.move({x: 0, y: 0}, 0)
  gravity_interval_object = window.setInterval(doGravity, gravity_interval_time);
  disable_inputs = false
}

function get_next_piece() {
  
  while (piece_buffer.length < 4) {
    if (piece_bag.length == 0) {
      piece_bag[0] = new I(1, 0, {x: board_width / 2, y: board_height / 2})
      piece_bag[1] = new J(2, 0, {x: board_width / 2, y: board_height / 2})
      piece_bag[2] = new L(3, 0, {x: board_width / 2, y: board_height / 2})
      piece_bag[3] = new O(4, 0, {x: board_width / 2, y: board_height / 2})
      piece_bag[4] = new S(5, 0, {x: board_width / 2, y: board_height / 2})
      piece_bag[5] = new T(6, 0, {x: board_width / 2, y: board_height / 2})
      piece_bag[6] = new Z(7, 0, {x: board_width / 2, y: board_height / 2})
    }
    piece_buffer.push(
      piece_bag.splice(Math.floor(Math.random() * piece_bag.length, 1))[0])
  }
  return piece_buffer.splice(0, 1)[0]; 
}

function game_over() {
  clearInterval(gravity_interval_object)
  disable_inputs = true
  offscreenCtx.fillStyle = "rgba(50, 50, 50, 0.5)"
  offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height)
  offscreenCtx.textAlign = "center"
  offscreenCtx.font = "48px serif"
  offscreenCtx.fillStyle = "black"
  offscreenCtx.fillText("game over", offscreenCanvas.width / 2, offscreenCanvas.height / 2)
  offscreenCtx.font = "50px serif"
  offscreenCtx.fillStyle = "white"
  offscreenCtx.fillText("game over", offscreenCanvas.width / 2, offscreenCanvas.height / 2)
  
  ctx.drawImage(offscreenCanvas, 0, 0)
}

function pretty_print_board() {
  string = ""
  for (var y = 0; y < board_height; y++) {
    for (var x = 0; x < board_width; x++) {
      string = string + board[y][x] + " "
    }
    string = string + "\n"
  }

  return string
}

function init_board() {
  var arr = []

  for(var y = 0; y < board_height; y++) {
    arr[y] = []
    for (var x = 0; x < board_width; x++) {
      arr[y][x] = 0
    }
  }

  return arr
}

function render_board() {
  offscreenCtx.fillStyle = "midnightblue"
  offscreenCtx.fillRect(0, 0, canvas.width, canvas.height)
  offscreenCtx.fillStyle = "white"
  offscreenCtx.fillRect(square_size_x * (board_width / 2 - 2), square_size_y * (board_height / 2 - 2), square_size_x * 4, square_size_y * 4)

  if (active != null) {
    offscreenCtx.fillStyle = get_color(active.color)
    var drop_blocks = active.find_drop()
    for (var i = 0; i < 4; i++) {
      offscreenCtx.fillRect(square_size_x * drop_blocks[i].x, square_size_y * drop_blocks[i].y, square_size_x, square_size_y)
    }
  }

  for (var board_y = 0; board_y < board_height; board_y++) {
    for (var board_x = 0; board_x < board_width; board_x++) {
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
          if (board_x >= (board_width / 2 - 2) && board_x < (board_width / 2 + 2) && board_y >= (board_height / 2 - 2) && board_y < (board_height / 2 + 2)) {
            offscreenCtx.fillStyle = "white"
          }
          else {
            offscreenCtx.fillStyle = "black"
          }
          break;
      }

      offscreenCtx.fillRect(board_x * square_size_x + grid_line_size, board_y * square_size_y + grid_line_size, square_size_x - (2 * grid_line_size), square_size_y - (2 * grid_line_size))
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

