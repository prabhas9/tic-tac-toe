// Game State
let currentPlayer = 'X';
let grid = Array(9).fill(null);
let moveHistory = [];
let scores = { X: 0, O: 0, draw: 0 };
let gameActive = true;
let mode = 'two-player';
let difficulty = 'easy';
let player1 = 'Player 1';
let player2 = 'Player 2';
let theme = 'glass';
let timerEnabled = false;
let timerInterval;
let timeLeft;

const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// DOM Elements
const cells = document.querySelectorAll('.cell');
const turnIndicator = document.getElementById('turn-indicator');
const resetBtn = document.getElementById('reset');
const undoBtn = document.getElementById('undo');
const historyDiv = document.getElementById('history');
const themeSelect = document.getElementById('theme');
const modeSelect = document.getElementById('mode');
const difficultySelect = document.getElementById('difficulty');
const timerInput = document.getElementById('timer');
const toggleTimerBtn = document.getElementById('toggle-timer');
const toggleModeBtn = document.getElementById('toggle-mode');
const player1Input = document.getElementById('player1');
const player2Input = document.getElementById('player2');
const scorePlayer1 = document.getElementById('score-player1');
const scoreDraw = document.getElementById('score-draw');
const scorePlayer2 = document.getElementById('score-player2');
const timerBar = document.getElementById('timer-bar');

// Update Theme
function updateTheme() {
    document.body.className = theme + (document.body.classList.contains('light-mode') ? ' light-mode' : '');
}

// Update Player Names
function updatePlayerNames() {
    player1 = player1Input.value || 'Player 1';
    player2 = mode === 'two-player' ? (player2Input.value || 'Player 2') : 'AI';
    updateScoreboard();
    updateTurnIndicator();
}

// Update Scoreboard
function updateScoreboard() {
    scorePlayer1.textContent = `${player1}: ${scores.X}`;
    scoreDraw.textContent = `Draw: ${scores.draw}`;
    scorePlayer2.textContent = `${player2}: ${scores.O}`;
}

// Update Turn Indicator
function updateTurnIndicator() {
    if (gameActive) {
        turnIndicator.textContent = `${currentPlayer === 'X' ? player1 : player2}'s Turn`;
    }
}

// Start Timer
function startTimer() {
    if (!timerEnabled || !gameActive) return;
    timeLeft = parseInt(timerInput.value) || 10;
    timerBar.style.display = 'block';
    timerBar.classList.add('active');
    timerBar.style.animation = `timer ${timeLeft}s linear forwards`;
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            switchPlayer();
            resetTimer();
        }
    }, 1000);
}

// Reset Timer
function resetTimer() {
    clearInterval(timerInterval);
    timerBar.style.animation = 'none';
    timerBar.offsetHeight; // Trigger reflow
    startTimer();
}

// Handle Cell Click
function handleCellClick(event) {
    if (!gameActive || (mode === 'single-player' && currentPlayer === 'O')) return;
    const index = parseInt(event.target.dataset.index);
    if (grid[index]) return;

    makeMove(index, currentPlayer);
    if (timerEnabled) resetTimer();
    if (mode === 'single-player' && gameActive) {
        setTimeout(aiMove, 500);
    }
}

// Make Move
function makeMove(index, player) {
    grid[index] = player;
    cells[index].textContent = player;
    cells[index].classList.add('marked', player.toLowerCase());
    moveHistory.push({ player, index });
    updateHistory();
    if ('vibrate' in navigator) navigator.vibrate(50); // Vibration feedback

    if (checkWin()) {
        endGame(`${currentPlayer === 'X' ? player1 : player2} Wins!`);
        scores[player]++;
        highlightWinningCells();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else if (grid.every(cell => cell)) {
        endGame("Draw!");
        scores.draw++;
    } else {
        switchPlayer();
    }
}

// Switch Player
function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnIndicator();
    if (timerEnabled) resetTimer();
}

// AI Move
function aiMove() {
    if (!gameActive) return;
    let index;
    const emptyCells = grid.map((val, i) => val ? null : i).filter(val => val !== null);

    if (difficulty === 'easy') {
        index = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else if (difficulty === 'medium') {
        index = findBlockingMove() || emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else { // Hard
        index = minimax(grid, 'O').index;
    }
    makeMove(index, 'O');
}

// Find Blocking Move (Medium Difficulty)
function findBlockingMove() {
    for (let combo of winningCombos) {
        const [a, b, c] = combo;
        if (grid[a] === 'X' && grid[b] === 'X' && !grid[c]) return c;
        if (grid[a] === 'X' && grid[c] === 'X' && !grid[b]) return b;
        if (grid[b] === 'X' && grid[c] === 'X' && !grid[a]) return a;
    }
    return null;
}

// Minimax Algorithm (Hard Difficulty)
function minimax(newGrid, player) {
    const emptyCells = newGrid.map((val, i) => val ? null : i).filter(val => val !== null);
    if (checkWinFor(newGrid, 'X')) return { score: -10 };
    if (checkWinFor(newGrid, 'O')) return { score: 10 };
    if (emptyCells.length === 0) return { score: 0 };

    const moves = [];
    for (let i of emptyCells) {
        const move = {};
        move.index = i;
        const gridCopy = [...newGrid];
        gridCopy[i] = player;
        move.score = minimax(gridCopy, player === 'O' ? 'X' : 'O').score;
        moves.push(move);
    }

    return player === 'O' 
        ? moves.reduce((best, move) => move.score > best.score ? move : best, { score: -Infinity })
        : moves.reduce((best, move) => move.score < best.score ? move : best, { score: Infinity });
}

// Check Win for Specific Board
function checkWinFor(board, player) {
    return winningCombos.some(combo => {
        const [a, b, c] = combo;
        return board[a] === player && board[b] === player && board[c] === player;
    });
}

// Check Win
function checkWin() {
    return checkWinFor(grid, currentPlayer);
}

// Highlight Winning Cells
function highlightWinningCells() {
    winningCombos.forEach(combo => {
        const [a, b, c] = combo;
        if (grid[a] === currentPlayer && grid[b] === currentPlayer && grid[c] === currentPlayer) {
            cells[a].classList.add('win');
            cells[b].classList.add('win');
            cells[c].classList.add('win');
        }
    });
}

// End Game
function endGame(message) {
    turnIndicator.textContent = message;
    gameActive = false;
    clearInterval(timerInterval);
    timerBar.style.display = 'none';
    updateScoreboard();
}

// Update History
function updateHistory() {
    historyDiv.innerHTML = 'Moves: ' + moveHistory.map((move, i) => `${i + 1}. ${move.player} on ${move.index}`).join(', ');
}

// Undo Move
function undoMove() {
    if (!gameActive || moveHistory.length === 0) return;
    const lastMove = moveHistory.pop();
    grid[lastMove.index] = null;
    cells[lastMove.index].textContent = '';
    cells[lastMove.index].classList.remove('marked', lastMove.player.toLowerCase());
    currentPlayer = lastMove.player;
    updateTurnIndicator();
    updateHistory();
    if (timerEnabled) resetTimer();
}

// Reset Game
function resetGame() {
    grid.fill(null);
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('marked', 'x', 'o', 'win');
    });
    moveHistory = [];
    updateHistory();
    currentPlayer = 'X';
    gameActive = true;
    mode = modeSelect.value;
    difficulty = difficultySelect.value;
    updatePlayerNames();
    updateTheme();
    if (timerEnabled) startTimer();
}

// Toggle Timer
function toggleTimer() {
    timerEnabled = !timerEnabled;
    timerInput.disabled = !timerEnabled;
    toggleTimerBtn.textContent = timerEnabled ? 'Disable Timer' : 'Enable Timer';
    if (timerEnabled && gameActive) startTimer();
    else {
        clearInterval(timerInterval);
        timerBar.style.display = 'none';
    }
}

// Event Listeners
cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
    cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') handleCellClick(e);
    });
});
resetBtn.addEventListener('click', resetGame);
undoBtn.addEventListener('click', undoMove);
themeSelect.addEventListener('change', () => {
    theme = themeSelect.value;
    updateTheme();
});
modeSelect.addEventListener('change', resetGame);
difficultySelect.addEventListener('change', () => difficulty = difficultySelect.value);
player1Input.addEventListener('input', updatePlayerNames);
player2Input.addEventListener('input', updatePlayerNames);
toggleModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    updateTheme();
});
toggleTimerBtn.addEventListener('click', toggleTimer);

// Initialize
updateTheme();
updatePlayerNames();
updateTurnIndicator();
updateScoreboard();