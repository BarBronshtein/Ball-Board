'use strict';
const WALL = 'WALL';
const FLOOR = 'FLOOR';
const BALL = 'BALL';
const GAMER = 'GAMER';
const GLUE = 'GLUE';
const elBallCollected = document.querySelector('.collected');
const GLUE_IMG = `<img src="img/candy.png"/>`;
const GAMER_IMG = '<img src="img/gamer.png" />';
const GAMER_PURPLE_IMG = `<img src="img/gamer-purple.png"/>`;
const BALL_IMG = '<img src="img/ball.png" />';
const modal = document.querySelector('.modal');
const audio = new Audio('audio/audio.mp3');
const gGame = {
  //
  ballsToBeCollected: 2,
  score: 0,
  intervalBall: null,
  intervalGlue: null,
  victory: false,
  isStuck: false,
};
var gBoard;
var gGamerPos;
var passeges;

function startGame() {
  gGamerPos = { i: 2, j: 9 };
  gBoard = buildBoard();
  init();
  closeModal();
  renderBoard(gBoard);
  passeges = [
    [0, gBoard[0].length / 2],
    [gBoard.length / 2, 0],
    [gBoard.length - 1, gBoard[0].length / 2],
    [gBoard.length / 2, gBoard[0].length - 1],
  ];
}

function init() {
  // initiallize variables

  closeModal();
  gGame.score = 0;
  gGame.isStuck = false;
  gGame.victory = false;
  gGame.ballsToBeCollected = ballsOnBoard();
  gGame.intervalBall = setInterval(genBallGame, 3000);
  gGame.intervalGlue = setInterval(genGlueGame, 5000);
  elBallCollected.textContent = gGame.score;
}

function buildBoard() {
  // Create the Matrix
  var board = createMat(10, 12);

  // Put FLOOR everywhere and WALL at edges
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      // Put FLOOR in a regular cell
      var cell = { type: FLOOR, gameElement: null };

      // Place Walls at edges
      if (
        i === 0 ||
        i === board.length - 1 ||
        j === 0 ||
        j === board[0].length - 1
      ) {
        cell.type = WALL;
        // Place Floor at the middle of each edges in our board
        if (
          (i === 0 && j === board[0].length / 2) ||
          (i === board.length - 1 && j === board[0].length / 2) ||
          (j === 0 && i === board.length / 2) ||
          (j === board[0].length - 1 && i === board.length / 2)
        )
          cell.type = FLOOR;
      }

      // Add created cell to The game board
      board[i][j] = cell;
    }
  }

  // Place the gamer at selected position
  board[gGamerPos.i][gGamerPos.j].gameElement = GAMER;

  // Place the Balls (currently randomly chosen positions)
  board[3][8].gameElement = BALL;
  board[7][4].gameElement = BALL;

  console.log(board);
  return board;
}

// Render the board to an HTML table
function renderBoard(board) {
  var strHTML = '';
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>\n';
    for (var j = 0; j < board[0].length; j++) {
      var currCell = board[i][j];

      var cellClass = getClassName({ i: i, j: j });

      cellClass += currCell.type === FLOOR ? ' floor' : ' wall';

      strHTML += `\t<td class="cell ${cellClass}" onclick="moveTo(${i},${j})" >\n`;

      switch (currCell.gameElement) {
        case GAMER:
          strHTML += GAMER_IMG;
          break;
        case BALL:
          strHTML += BALL_IMG;
          break;
      }

      strHTML += '\t</td>\n';
    }
    strHTML += '</tr>\n';
  }

  var elBoard = document.querySelector('.board');
  elBoard.innerHTML = strHTML;
}

// Move the player to a specific location
function moveTo(i, j) {
  if (gGame.isStuck || gGame.victory) {
    return;
  }
  /* If player is in one of the passages and adjusts
  i and j so player could move to the desired passage
  */
  if (i < 0 || i === gBoard.length) {
    i = i < 0 ? gBoard.length - 1 : 0;
    moveGamerToPos(i, j);
  }
  if (j < 0 || j === gBoard[0].length) {
    j = j < 0 ? gBoard[0].length - 1 : 0;
    moveGamerToPos(i, j);
  }

  var targetCell = gBoard[i][j];
  if (targetCell.type === WALL) return;

  // Calculate distance to make sure we are moving to a neighbor cell
  var iAbsDiff = Math.abs(i - gGamerPos.i);
  var jAbsDiff = Math.abs(j - gGamerPos.j);

  /* If the clicked Cell is one of the four allowed or
  is user going through passage
  */
  if (
    !((iAbsDiff === 1 && jAbsDiff === 0) || (jAbsDiff === 1 && iAbsDiff === 0))
  ) {
    var cellSelector = '.' + getClassName({ i, j });
    var elCell = document.querySelector(cellSelector);
    elCell.style.backgroundColor = 'red';
    elCell.style.cursor = 'not-allowed';
    setTimeout(
      () => {
        elCell.style.backgroundColor = 'peachpuff';
        elCell.style.cursor = 'pointer';
      },

      100
    );
    return;
  }

  if (targetCell.gameElement === BALL) {
    console.log('Collecting!');
    gGame.ballsToBeCollected--;
    gGame.score++;
    elBallCollected.textContent = gGame.score;
    audio.play();
  }
  if (targetCell.gameElement === GLUE) {
    gGame.isStuck = true;
    // start timer
    setTimeout(() => {
      gGame.isStuck = false;
    }, 3000);
    moveGamerToPos(i, j);
    renderCell(gGamerPos, GAMER_PURPLE_IMG);

    return;
  }

  // MOVING from current position
  // Model:
  gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;
  // Dom:
  renderCell(gGamerPos, '');

  // MOVING to selected position
  // Model:
  moveGamerToPos(i, j);
  // DOM:
  renderCell(gGamerPos, GAMER_IMG);
  if (!gGame.ballsToBeCollected) endGame();
}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
  if (!location) return;
  var cellSelector = '.' + getClassName(location);
  var elCell = document.querySelector(cellSelector);
  elCell.innerHTML = value;
}

// Move the player by keyboard arrows
function handleKey(event) {
  var i = gGamerPos.i;
  var j = gGamerPos.j;

  switch (event.key) {
    case 'ArrowLeft':
      moveTo(i, j - 1);
      break;
    case 'ArrowRight':
      moveTo(i, j + 1);
      break;
    case 'ArrowUp':
      moveTo(i - 1, j);
      break;
    case 'ArrowDown':
      moveTo(i + 1, j);
      break;
  }
}

// Returns the class name for a specific cell
function getClassName(location) {
  var cellClass = 'cell-' + location.i + '-' + location.j;
  return cellClass;
}

function getRandomElPos(val = BALL) {
  // Getting empty cell and putting a value
  const [i, j] = getRandEmptyCell();
  const cell = gBoard[i][j];
  // Updating model
  if (cell.gameElement) return;
  // Updating DOM
  if (val === BALL) {
    var valImg = BALL_IMG;
    gGame.ballsToBeCollected++;
  } else valImg = GLUE_IMG;

  cell.gameElement = val;
  renderCell({ i, j }, valImg);

  setTimeout(() => {
    // Updating model
    if (cell.gameElement !== GLUE) return;

    cell.gameElement = null;
    // Updating DOM
    renderCell({ i, j }, '');
  }, 3000);
}

function genBallGame() {
  // Generating a BALL element in a random location
  getRandomElPos();
}
function genGlueGame() {
  // Generating a GLUE element in a random location
  getRandomElPos(GLUE);
}

function ballsOnBoard() {
  // If there are no balls game is over
  let balls = 0;
  for (let i = 1; i < gBoard.length - 1; i++) {
    for (let j = 1; j < gBoard[i].length - 1; j++) {
      if (gBoard[i][j].gameElement === BALL) balls++;
    }
  }
  return balls;
}

function endGame() {
  let msg = `<h2>Congratulations you have won the game</h2><button onclick="startGame()" class=li-purple>Restart</button>`;
  // Clearing the intervals and rendering msg on screen
  clearInterval(gGame.intervalBall);
  clearInterval(gGame.intervalGlue);
  openModal(msg);
  gGame.victory = true;
}

function openModal(msg) {
  // Rendering a win/lose msg
  modal.classList.remove('hidden');
  modal.innerHTML = msg;
}

function closeModal() {
  modal.classList.add('hidden');
}

function getRandEmptyCell() {
  const emptyCells = [];
  for (let i = 1; i < gBoard.length - 2; i++) {
    for (let j = 1; j < gBoard[i].length - 2; j++) {
      if (gBoard[i][j].gameElement === null) emptyCells.push([i, j]);
    }
  }
  const emptyCellIdx = getRandomInc(0, emptyCells.length - 1);
  return emptyCells[emptyCellIdx];
}

function moveGamerToPos(i, j) {
  renderCell(gGamerPos, '');
  gGamerPos.i = i;
  gGamerPos.j = j;
  gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
  gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;
  renderCell(gGamerPos, GAMER_IMG);
}
