class Move {
  constructor(coordinates, points) {
    this.coordinates = coordinates;
    this.points = points;
  }
}

class Board {
  static MAX_SCORE = 100;
  
  static MIN_SCORE = -Board.MAX_SCORE;
  
  // Board of weight of each position, where corners and most edges are important
  static BOARD_WEIGHTS = [
    [100, -10, 10, 3, 3, 10, -10, 100],
    [-10, -20, -3, -3, -3, -3, -20, -10],
    [10, -3, 8, 1, 1, 8, -3, 10],
    [3, -3, 1, 1, 1, 1, -3, 3],
    [3, -3, 1, 1, 1, 1, -3, 3],
    [10, -3, 8, 1, 1, 8, -3, 10],
    [-10, -20, -3, -3, -3, -3, -20, -10],
    [100, -10, 10, 3, 3, 10, -10, 100],
  ];
  
  // Returns a shallow copy of the board
  static copyBoard = (board) => JSON.parse(JSON.stringify(board));
  
  // Returns the opponent of a player
  static opponent = (P) => (P === 1 ? 2 : 1);
  
  // Returns the scores of the two players
  static playerScores = (board, P1, P2) => {
    let P1_score = 0;
    let P2_score = 0;
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] === P1) {
          P1_score += 1;
        } else if (board[i][j] === P2) {
          P2_score += 1;
        }
      }
    }
    
    return [P1_score, P2_score];
  }
  
  // Returns the heuristic value of a player
  static heuristicValue = (board, P) => {
    let score = 0;
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] === P) {
          score += Board.BOARD_WEIGHTS[i][j];
        } else if (board[i][j] === Board.opponent(P)) {
          score -= Board.BOARD_WEIGHTS[i][j];
        }
      }
    }
    
    return score;
  }
  
  // Checks if a coordinate is within the board or not
  static inBound = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;
  
  // Returns final value of a player when the game ends
  static finalValue = (board, P) => {
    const score = Board.heuristicValue(board, P);
    
    if (score < 0) {
      return Board.MIN_SCORE;
    } else if (score > 0) {
      return Board.MAX_SCORE;
    }
     
    return score;
  }
  
  // Returns the points
  static countPoints = (board, row, col, horz, vert) => {
    const player = board[row][col];
    let points = 0;
    
    for (let scalar = 1; scalar <= 8; scalar++) {
      if (Board.inBound(row + scalar, col + scalar)) {
        if (board[row + scalar * horz][col + scalar * vert] === 0) {
          return 0;
        } else if ([row + scalar * horz][col + scalar * vert] === player) {
          points++;
        } else {
          return points;
        }
      } else {
        return 0;
      }
    }
    
    return points;
  }
  
  // Returns the points of a player move
  static checkMove = (board, row, col, player) => {
    let points = 0;
    const direction = [-1, 0, 1];
    
    for (let horz of direction) {
      for (let vert of direction) {
        if (vert !== 0 || horz !== 0) {
          if (Board.inBound(row + horz, col + vert)) {
            examined = board[row + horz][col + vert];
            
            if (examined !== 0 && examined !== player) {
              points += Board.countPoints(board, row + horz, col + vert, horz, vert);
            }

            if (points > 0) {
              return points;
            }
          }
        }
      }
    }
  };
  
  // Returns all valid moves of a player
  static getValidMoves = (board, player) => {
    let validMoves = [];
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] === 0) {
          points = Board.checkMove(board, i, j, player);
          if (points > 0) {
            validMoves.push(new Move([i, j], points));
          }
        }
      }
    }
    
    return validMoves.length === 0 ? null : validMoves;
  }
  
  // Returns a new instance of the board when a move is applied
  static transformBoard = (board, move, player) => {
    if (move === null) {
      return board;
    }
    
    let [row, col] = move;
    let newBoard = Board.copyBoard(board);
    newBoard[row][col] = player;

    // This combination checks surrounding cells
    const directions = [-1, 0, 1];
    for (let vert of directions) {
      for (let horz of directions) {
        let discs = [];
        if (vert === 0 && horz === 0) {
          continue;
        }
        
        let lrow = row;
        let lcol = col;
        lrow += vert;
        lcol += horz;
        
        while (Board.inBound(lrow, lcol)) {
          // If opponent's disc, append to flip later
          if (newBoard[lrow][lcol] !== player && newBoard[lrow][lcol] !== 0) {
            discs.push([lrow, lcol]);
            // Space breaks direct line, no disc flipped
          } else if (newBoard[lrow][lcol] === 0) {
            break;
            // If same player disc found, flip all discs in between
          } else if (newBoard[lrow][lcol] === player) {
            for (let [x, y] of discs) {
              newBoard[x][y] = player;
            }
            break;
          }
          
          lrow += vert;
          lcol += horz;
        }
      }
    }
    
    return newBoard;
  }
  
  // Checks if a move is valid or not
  static isValid = (board, x, y, player) => Board.checkMove(board, x, y, player) > 0;
  
  // Checks if a player has no move or not
  static hasNoMoves = (board, player) => Board.getValidMoves(board, player) == null;
  
  // Returns the best move using search algorithm
  static bestMoves = (board, player, depth = 1) => Board.hasNoMoves(board, player) ? null : Board.alphaBetaSearch(board, player, Board.MIN_SCORE, Board.MAX_SCORE, depth);
  
  // Returns the best move using alpha-beta search algorithm
  static alphaBetaSearch = (board, player, alpha, beta, depth) => {
    if (depth === 0) {
      return new Move (None, Board.heuristicValue(board, player));
    }
    
    const validMoves = Board.validMoves(board, player);
    
    if (!validMoves) {
      if (!Board.getValidMoves(board, Board.opponent(player))) {
        return new Move(null, Board.finalValue(board, player));
      }
      value = Board.alphaBetaSearch(board, Board.opponent(player), -beta, -alpha, depth - 1).points;
      return new Move(null, value)
    }
    
    let bestMove = validMoves[0];
    bestMove.points = alpha;
    
    for (let move of validMoves) {
      if (beta <= alpha) {
        break;
      }
      
      const moveBoard = Board.transformBoard(board, move.coordinates, player);
      const value = -Board.alphabeta_search(moveBoard, Board.opponent(player), -beta, -alpha, depth - 1).points;
      
      if (value > alpha) {
        alpha = value;
        bestMove = move;
        bestMove.points = alpha;
      }
    }
    
    return bestMoves;
  }
}

board = new Board();
console.log(Board.MIN_SCORE);
