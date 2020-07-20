const size = 400;
const scl = size / 8;
const board = {
  off: 50,
  generateCells: () => {
    // like a matrix, i is to the rows and j is to the cols
    let cells = [];
    for(let i = 0; i < 12; i++){
      cells[i] = [];
      for(let j = 0; j < 12; j++) {
        let x = - board.off + j * scl;
        let y = - board.off + i * scl;
        let position = createVector(x, y);
        if((i + j) % 2 == 0) {
          cells[i][j] = {
                          color: "white",
                          pos: position,
                          occupied: ""
                        };
        } else {
          cells[i][j] = {
                          color: "black",
                          pos: position,
                          occupied: ""
                        };
        }
      }
    }
    return cells;
  },
  
  show: (cells) => {
    let off = board.off;
    // the board starts in i and j = 2 for preventing errors like "cannot read property from undefined"
    for(let i = 2; i < 10; i++) {
      for(let j = 2; j < 10; j++) {
        let x = -off + j * scl;
        let y = -off + i * scl;
        push();
        fill(cells[i][j].color);
        rect(x, y, scl, scl);
        pop();
      }
    }
  },
  
  showCoordinates: () => {
    let i = 8;
    let letters = "ABCDEFGH"
    for(let y = 80; y < size + 50; y += 50) {
      text(str(i), 35, y);
      i--;
    }
    for(let x = 70; x < size + 50; x += 50) {
      text(letters[i], x, 470);
      i++;
    }
  }
  
}
var cells;
var current, player1, player2, pSelected;

function setup() {
  createCanvas(500, 500);
  strokeWeight(2);
  textSize(16);
  cells = board.generateCells();
  player1 = generatePlayer("white");
  player2 = generatePlayer("brown");
  current = player1;
  for(let i = 0; i < 2; i++) {
    cells[i][0].occupied = true;
    cells[i][1].occupied = true;
    cells[0][i].occupied = true;
    cells[1][i].occupied = true;
  }
}

function draw() {
  background(200);
  board.show(cells);
  board.showCoordinates();
  for(let p of player1) {
    p.show();
  }
  for(let p of player2) {
    p.show();
  }
  winner();
}

function mousePressed() {
  if(mouseX > board.off && mouseX < board.off + size && mouseY > board.off && mouseY < board.off + size) {
    if(pSelected) {
      let clickPos = findCell(mouseX, mouseY);
      for(let k = 0; k < pSelected.neighbors.length; k++) {
        if(clickPos.i == pSelected.neighbors[k].i && clickPos.j == pSelected.neighbors[k].j) {
          pSelected.move(clickPos.i, clickPos.j);
          pSelected.chkNeighbors();
        }
      }
      pSelected.selected = false;
      pSelected = undefined;
    } else {
      for(let p of current) {
        p.clicked(mouseX, mouseY);
        p.chkNeighbors();
      }
      pSelected = selectPiece();
      console.log(pSelected.i + ", " + pSelected.j);
      console.log(pSelected.neighbors);
    }
  }
}






class Piece {
  constructor(color, i, j) {
    this.color = color;
    this.i = i;
    this.j = j;
    cells[i][j].occupied = color;
    this.selected = false;
    this.neighbors = [];
    this.type = "normal";
  }
  
  show() {
    let pos = cells[this.i][this.j].pos;
    let off = scl / 2;
    if(this.type == "normal") {
    push();
    strokeWeight(2);
    fill(this.color);
    if(current[0].color == this.color) {
      stroke(150);
    }
    if(this.selected) {
      circle(mouseX, mouseY, scl * 0.7);
    } else {
      circle(pos.x + off, pos.y + off, scl * 0.7);
    }
    pop();
    }
    if(this.type == "king") {
      push();
      strokeWeight(1);
      fill(this.color);
      if(current[0].color == this.color) {
      stroke(150);
      }
      if(this.selected) {
        circle(mouseX, mouseY, scl * 0.7);
        fill("yellow");
        let off = 25;
        let x = mouseX - off;
        let y = mouseY - off;
        stroke(0, 0, 0);
        beginShape();
        vertex(x + 15, y + 30);
        vertex(x + 15, y + 15);
        vertex(x + 20, y + 25);
        vertex(x + 25, y + 15);
        vertex(x + 30, y + 25);
        vertex(x + 35, y + 15);
        vertex(x + 35, y + 30);
        endShape(CLOSE);
      } else {
        circle(pos.x + off, pos.y + off, scl * 0.7);
        fill("yellow");
        beginShape();
        vertex(pos.x + 15, pos.y + 30);
        vertex(pos.x + 15, pos.y + 15);
        vertex(pos.x + 20, pos.y + 25);
        vertex(pos.x + 25, pos.y + 15);
        vertex(pos.x + 30, pos.y + 25);
        vertex(pos.x + 35, pos.y + 15);
        vertex(pos.x + 35, pos.y + 30);
        endShape(CLOSE);
      }
      pop();
    }
  }
  
  clicked(px, py) {
    let pos = cells[this.i][this.j].pos;
    let x = pos.x;
    let y = pos.y;
    if(px > x && px < x + scl && py > y && py < y + scl) {
      this.selected = true;
    }
  }
  
  move(i, j) {
    cells[this.i][this.j].occupied = "";
    let oldI = this.i;
    let oldJ = this.j;
    let newI = i;
    let newJ = j;
    this.i = i;
    this.j = j;
    this.crown();
    cells[this.i][this.j].occupied = current[0].color;
    capture(oldI, oldJ, newI, newJ);
    endTurn();
  }
  
  chkNeighbors() {
    this.neighbors = [];
    // for 'normal' type: neighbors = [left, right]
    // for king type: neighbors = [upper left, upper right, bottom left, bottom right]
    // positions relative to player 1 (whites)
    if(this.type == "normal") {
      if(this.color == "white") {
        let left = { i: this.i - 1, j: this.j - 1 };
        let right = { i: this.i - 1, j: this.j + 1 };
        if(left.i >= 2 && left.i < 10 && left.j >= 2 && left.j < 10) {
          if(cells[left.i][left.j].occupied != "white") {
            this.neighbors.push(left);
          }
        }
        if(right.i >= 2 && right.i < 10 && right.j >= 2 && right.j < 10) {
          if(cells[right.i][right.j].occupied != "white") {
            this.neighbors.push(right);
          }
        }
      } else if(this.color == "brown") {
        let left = { i: this.i + 1, j: this.j - 1 };
        let right = { i: this.i + 1, j: this.j + 1 };
        if(left.i >= 2 && left.i < 10 && left.j >= 2 && left.j < 10) {
          if(cells[left.i][left.j].occupied != "brown") {
            this.neighbors.push(left);
          }
        }
        if(right.i >= 2 && right.i < 10 && right.j >= 2 && right.j < 10) {
          if(cells[right.i][right.j].occupied != "brown") {
            this.neighbors.push(right);
          }
        }
      }
    } else if(this.type == "king") {
      if(this.color == "white") {
        let left = { i: this.i - 1, j: this.j - 1 };
        let right = { i: this.i - 1, j: this.j + 1 };
        if(left.i >= 2 && left.i < 10 && left.j >= 2 && left.j < 10) {
          if(cells[left.i][left.j].occupied != "white") {
            this.neighbors.push(left);
          }
        }
        if(right.i >= 2 && right.i < 10 && right.j >= 2 && right.j < 10) {
          if(cells[right.i][right.j].occupied != "white") {
            this.neighbors.push(right);
          }
        }
        left = { i: this.i + 1, j: this.j - 1 };
        right = { i: this.i + 1, j: this.j + 1 };
        if(left.i >= 2 && left.i < 10 && left.j >= 2 && left.j < 10) {
          if(cells[left.i][left.j].occupied != "white") {
            this.neighbors.push(left);
          }
        }
        if(right.i >= 2 && right.i < 10 && right.j >= 2 && right.j < 10) {
          if(cells[right.i][right.j].occupied != "white") {
            this.neighbors.push(right);
          }
        }
      } else if(this.color == "brown") {
        let left = { i: this.i - 1, j: this.j - 1 };
        let right = { i: this.i - 1, j: this.j + 1 };
        if(left.i >= 0 && left.i < 8 && left.j >= 0 && left.j < 8) {
          if(cells[left.i][left.j].occupied != "brown") {
            this.neighbors.push(left);
          }
        }
        if(right.i >= 2 && right.i < 10 && right.j >= 2 && right.j < 10) {
          if(cells[right.i][right.j].occupied != "brown") {
            this.neighbors.push(right);
          }
        }
        left = { i: this.i + 1, j: this.j - 1 };
        right = { i: this.i + 1, j: this.j + 1 };
        if(left.i >= 2 && left.i < 10 && left.j >= 2 && left.j < 10) {
          if(cells[left.i][left.j].occupied != "brown") {
            this.neighbors.push(left);
          }
        }
        if(right.i >= 2 && right.i < 10 && right.j >= 2 && right.j < 10) {
          if(cells[right.i][right.j].occupied != "brown") {
            this.neighbors.push(right);
          }
        }
      }
    }
    chkCapture(this);
  }
  
  crown() {
    if(this.type == "normal") {
      if(this.color == "white" && this.i == 2) {
        this.type = "king";
      } else if(this.color == "brown" && this.i == 9) {
        this.type = "king";
      }
    }
  }

}







function generatePlayer(player) {
  let pieces = [];
  if(player == "white") {
    for(let i = 7; i < 10; i++) {
      for(let j = 2; j < 10; j++) {
        if(cells[i][j].color == "black") {
          pieces.push( new Piece(player, i, j) );
        }
      }
    }
  } else if(player == "brown") {
    for(let i = 2; i < 5; i++) {
      for(let j = 2; j < 10; j++) {
        if(cells[i][j].color == "black") {
          pieces.push( new Piece(player, i, j) );
        }
      }
    }
  }
  return pieces;
}

function findCell(x, y) {
  for(let i = 0; i < cells.length; i++) {
    for(let j = 0; j < cells[i].length; j++) {
      let cx = cells[i][j].pos.x;
      let cy = cells[i][j].pos.y;
      if(x > cx && x < cx + scl && y > cy && y < cy + scl) {
        return { i: i, j: j };
      }
    }
  }
}

function isOccupied(i, j) {
  for(let p of player1) {
    if(p.i == i && p.j == j) { return true; }
  }
  for(let p of player2) {
    if(p.i == i && p.j == j) { return true; }
  }
  return false;
}

function selectPiece(px, py) {
  for(let p of current) {
    if(p.selected) {
      return p;
    }
  }
}

function endTurn() {
  current = next();
}

function next() {
  if(current == player1) {
    return player2;
  } else {
    return player1;
  }
}

function chkCapture(piece) {
  let index;
  for(let n of piece.neighbors) {
    for(let p of next()) {
      if(n.i == p.i && n.j == p.j) {
        console.log("FOUND")
        if(piece.i - n.i > 0) {
          // target piece is on the upper side
          if(piece.j - n.j > 0) {
             // target piece is on the left side
            if(!cells[piece.i - 2][piece.j - 2].occupied) {
               piece.neighbors.push({ i: piece.i - 2, j: piece.j - 2 });
            }
          } else {
            // target piece if on the right side
            if(!cells[piece.i - 2][piece.j + 2].occupied) {
               piece.neighbors.push({ i: piece.i - 2, j: piece.j + 2 });
            }
          }
        } else {
          // target piece is on the bottom side
          if(piece.j - n.j > 0) {
            // target piece is on the left side
            if(!cells[piece.i + 2][piece.j - 2].occupied) {
               piece.neighbors.push({ i: piece.i + 2, j: piece.j - 2 });
            }
          } else {
            // targe piece is on the right side
            if(!cells[piece.i + 2][piece.j + 2].occupied) {
               piece.neighbors.push({ i: piece.i + 2, j: piece.j + 2 });
            }
          }
        }
        index = piece.neighbors.indexOf(n);
        piece.neighbors.splice(index, 1)
        console.log(index);
      }
    }
  }
}

function capture(oldI, oldJ, newI, newJ) {
  if(abs(newI - oldI) == 2) {
    let targetI = round((oldI + newI) / 2);
    let targetJ = round((oldJ + newJ) / 2);
    for(let i = next().length - 1; i >= 0; i--) {
      if(next()[i].i == targetI && next()[i].j == targetJ) {
        next().splice(i, 1);
      }
    }
    cells[targetI][targetJ].occupied = "";
  }
}

function winner() {
  if(player1.length == 0) {
    noLoop();
    console.log("Brown wins!");
  } else if(player2.length == 0) {
    noLoop();
    console.log("White wins!");
  }
}