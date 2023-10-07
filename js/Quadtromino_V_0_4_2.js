
//make the active and inactive canvas
let canvas = null
let ctx = null

let boardCanvas = null
let boardCtx = null

let sideCanvas = null
let sideCtx = null

let board_width = 18
let board_height = 18

const board = init_board()
/*
const board = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, ],
               [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
               [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, ],
               [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, ]]
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
let lines_cleared = 0
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

  boardCanvas = document.createElement("canvas");
  boardCanvas.width = 32 * board_width
  boardCanvas.height = 32 * board_height 
  boardCtx = boardCanvas.getContext("2d");

  sideCanvas = document.createElement("canvas")
  sideCanvas.width = canvas.width - boardCanvas.width - 32
  sideCanvas.height = canvas.height
  sideCtx = sideCanvas.getContext("2d")

  square_size_x = boardCanvas.width / board_width 
  square_size_y = boardCanvas.height / board_height

  console.log(square_size_x)

  active = get_next_piece()
  active.move({x: 0, y: 0}, 0)

  render_side()
  render_boarders()

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
    case "w":
      dir = up
      break;
    case "ArrowDown":
    case "s":
      dir = down
      break;
    case "ArrowLeft":
    case "a":
      dir = left
      break;
    case "ArrowRight":
    case "d":
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
    set_boarder(next_gravity_dir, "rgb(50, 50, 10)")
    set_boarder(gravity_dir, "yellow")
    next_gravity_dir = dir
    set_boarder(dir, "rgb(120, 120, 0)")
    window.requestAnimationFrame(function(){})
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
      //console.log("resetting gravity interval")
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
  //console.log("starting full line check")
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
  //console.log("vert lines")
  //console.log(vert_lines_to_check)
  //console.log("horiz lines")
  //console.log(horiz_lines_to_check)
  
  
  var horiz_full_lines = []
  for (var i = 0; i < horiz_lines_to_check.length; i++) {
    if (check_line("y", horiz_lines_to_check[i])) {
      horiz_full_lines.push(horiz_lines_to_check[i]);
    }
  }
  //console.log("y full lines")
  //console.log(horiz_full_lines)
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
  //console.log("x full lines")
  //console.log(vert_full_lines)
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
  //console.log("no full lines")
  gravity_dir = next_gravity_dir
  active = get_next_piece()
  active.move({x: 0, y: 0}, 0)
  render_boarders()
  render_side()
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
  lines_cleared += length

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
      break;
    case left:
      for (var x = start_line; x > start_line - length; x--) {
        for (var y = 0; y < board_height; y++) {
          board[y][x] = 0
        }
      }
      break;
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
  boardCtx.fillStyle = "white"
  switch (dir) {
    case up:
      boardCtx.fillRect(progress * square_size_x, (start_line - length + 1) * square_size_y, square_size_x, length * square_size_y)
      break;
    case down:
      boardCtx.fillRect((board_width - 1 - progress) * square_size_x, start_line * square_size_y, square_size_x, length * square_size_y)
      break;
    case left:
      boardCtx.fillRect((start_line - length + 1) * square_size_x, (board_height - 1 - progress) * square_size_y, length * square_size_x, square_size_y)
      break;
    case right:
      boardCtx.fillRect(start_line * square_size_x, progress * square_size_y, length * square_size_x, square_size_y)
      break;
  }

  ctx.drawImage(boardCanvas, 16, 16)
  //TODO: DOES NOT CORRECTLY HANDLE RECTANGLE BOARD
  if (progress == board_width - 1) {
    setTimeout(() => {
      render_board()
      //console.log("actually boutta shift!")
      setTimeout(line_shift, 40, start_line, length, dir, 0)
    }, 20);
  }
  else {
    setTimeout(whiteout_line, 10, start_line, length, dir, progress + 1)
  }
}

function line_shift(start_line, length, dir, progress) {
  //console.log("line shifting with start line: " + start_line)
  switch (dir) {
    case up:
      //console.log("shift case up")
      for (var x = 0; x < board_width; x++) {
        source_block = {x: x, y: start_line - length - progress}
        //console.log(source_block)

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
      //console.log("shift case down")
      for (var x = 0; x < board_width; x++) {
        source_block = {x: x, y: start_line + length + progress}

        if (source_block.y < board_height / 2) {
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
      //console.log("shift case left")
      for (var y = 0; y < board_height; y++) {
        source_block = {x: start_line - length - progress, y: y}

        if (source_block.x >= board_width / 2) {
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
      //console.log("shift case right")
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
  render_side()
  render_boarders()
  gravity_interval_object = window.setInterval(doGravity, gravity_interval_time)
  disable_inputs = false
}

function get_next_piece() {
  //console.log("getting next piece")
  //console.log("bag length: " + piece_bag.length)
  
  while (piece_buffer.length < 5) {
    if (piece_bag.length == 0) {
      //console.log("piece bag refilled")
      piece_bag[0] = new I(1, 0, {x: board_width / 2, y: board_height / 2})
      piece_bag[1] = new J(2, 0, {x: board_width / 2, y: board_height / 2})
      piece_bag[2] = new L(3, 0, {x: board_width / 2, y: board_height / 2})
      piece_bag[3] = new O(4, 0, {x: board_width / 2, y: board_height / 2})
      piece_bag[4] = new S(5, 0, {x: board_width / 2, y: board_height / 2})
      piece_bag[5] = new T(6, 0, {x: board_width / 2, y: board_height / 2})
      piece_bag[6] = new Z(7, 0, {x: board_width / 2, y: board_height / 2})
    }
    piece_buffer.push(
      piece_bag.splice(Math.floor(Math.random() * piece_bag.length), 1)[0])
  }
  //console.log("piece bag")
  //console.log(piece_bag)
  //console.log("piece buffer")
  //console.log(piece_buffer)
  return piece_buffer.splice(0, 1)[0]; 
}

function game_over() {
  clearInterval(gravity_interval_object)
  disable_inputs = true
  boardCtx.fillStyle = "rgba(50, 50, 50, 0.5)"
  boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height)
  boardCtx.textAlign = "center"
  boardCtx.font = "48px sans serif"
  boardCtx.fillStyle = "black"
  boardCtx.fillText("game over", boardCanvas.width / 2, boardCanvas.height / 2)
  boardCtx.font = "50px sans serif"
  boardCtx.fillStyle = "white"
  boardCtx.fillText("game over", boardCanvas.width / 2, boardCanvas.height / 2)
  boardCtx.fillStyle = "teal"
  boardCtx.font = "30px sans serif"
  boardCtx.fillText("You cleared " + lines_cleared + " line" + ((lines_cleared == 1) ? "" : "s") + "!", boardCanvas.width / 2, boardCanvas.height / 2 + boardCanvas.height / 6)
  
  ctx.drawImage(boardCanvas, 16, 16)
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

function render_side() {
  sideCtx.fillStyle = "gray"
  sideCtx.fillRect(0, 0, sideCanvas.width, sideCanvas.height)

  sideCtx.fillStyle = "darkblue"
  sideCtx.textAlign = "center"
  sideCtx.font = "26px sans serif"
  sideCtx.fillText("Lines cleared:", sideCanvas.width / 2, 50)
  sideCtx.fillText(lines_cleared, sideCanvas.width / 2, 90)

  sideCtx.fillStyle = "darkred"
  sideCtx.fillText("Next:", sideCanvas.width / 2, 190)

  var line_offset = 0;

  for (var i = 0; i < piece_buffer.length; i++) {
    var piece = piece_buffer[i]
    var piece_blocks = piece.get_offset(0)

    sideCtx.fillStyle = get_color(piece.color)
    for (var j = 0; j < 4; j++) {
      sideCtx.fillRect((sideCanvas.width / 2 - square_size_x / 2) + (square_size_x * piece_blocks[j].x), 250 + (square_size_y * piece_blocks[j].y) + (3 * i * square_size_y) - line_offset, square_size_x, square_size_y)
    }

    if (piece.color == 1) {
      line_offset += square_size_y;
    }
  }

  ctx.drawImage(sideCanvas, boardCanvas.width + 32, 0)
}

function render_board() {
  boardCtx.fillStyle = "midnightblue"
  boardCtx.fillRect(0, 0, canvas.width, canvas.height)
  boardCtx.fillStyle = "white"
  boardCtx.fillRect(square_size_x * (board_width / 2 - 2), square_size_y * (board_height / 2 - 2), square_size_x * 4, square_size_y * 4)

  if (active != null) {
    boardCtx.fillStyle = get_color(active.color)
    var drop_blocks = active.find_drop()
    for (var i = 0; i < 4; i++) {
      boardCtx.fillRect(square_size_x * drop_blocks[i].x - grid_line_size, square_size_y * drop_blocks[i].y - grid_line_size, square_size_x + grid_line_size, square_size_y + grid_line_size)
    }
  }

  for (var board_y = 0; board_y < board_height; board_y++) {
    for (var board_x = 0; board_x < board_width; board_x++) {
      switch (Math.abs(board[board_y][board_x])) {
        case 1:
          boardCtx.fillStyle = "teal"
          break;
        case 2:
          boardCtx.fillStyle = "blue"
          break;
        case 3:
          boardCtx.fillStyle = "orange"
          break;
        case 4:
          boardCtx.fillStyle = "yellow"
          break
        case 5:
          boardCtx.fillStyle = "green"
          break;
        case 6:
          boardCtx.fillStyle = "purple"
          break;
        case 7:
          boardCtx.fillStyle = "red"
          break;
        default:
          if (board_x >= (board_width / 2 - 2) && board_x < (board_width / 2 + 2) && board_y >= (board_height / 2 - 2) && board_y < (board_height / 2 + 2)) {
            boardCtx.fillStyle = "white"
          }
          else {
            boardCtx.fillStyle = "black"
          }
          break;
      }

      boardCtx.fillRect(board_x * square_size_x + grid_line_size, board_y * square_size_y + grid_line_size, square_size_x - (2 * grid_line_size), square_size_y - (2 * grid_line_size))
    }
  }

  ctx.drawImage(boardCanvas, 16, 16)
}

function render_boarders() {
  //console.log("rendering boarders")
  set_boarder(up, "rgb(50, 50, 10)")
  set_boarder(down, "rgb(50, 50, 10)")
  set_boarder(left, "rgb(50, 50, 10)")
  set_boarder(right, "rgb(50, 50, 10)")

  set_boarder(gravity_dir, "yellow")
}

function set_boarder(dir, color) {
  ctx.fillStyle = color

  switch (dir) {
    case up:
      ctx.fillRect(16, 0, boardCanvas.width, 16)
      break;
    case down:
      ctx.fillRect(16, 16 + boardCanvas.height, boardCanvas.width, 16)
      break;
    case left:
      ctx.fillRect(0, 16, 16, boardCanvas.height)
      break;
    case right:
      ctx.fillRect(16 + boardCanvas.width, 16, 16, boardCanvas.height)
      break;
  }
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

function fillRoundRect(local_ctx, x_start, y_start, width, height, boarder_rad, ) {
  
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

