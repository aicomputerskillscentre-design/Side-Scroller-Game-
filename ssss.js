
// Canvas elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let score = 0;
let gameRunning = true;
let frame = 0;
let difficulty = 1;  // increases over time

// Player object
const player = {
    x: 100,
    y: 300,
    width: 40,
    height: 40,
    ySpeed: 0,
    isJumping: false,
    grounded: true,
    color: '#FFD966'
};

// World settings
const gravity = 0.8;
const jumpPower = -12;
const groundY = 360; // where ground is (canvas height - player height roughly)

// Arrays for objects
let enemies = [];
let coins = [];

// Spawn timers
let enemySpawnDelay = 0;
let coinSpawnDelay = 0;

// Controls (touch & mouse)
let leftPressed = false;
let rightPressed = false;

// ----- Helper Functions -----
function updateScoreUI() {
    document.getElementById('scoreValue').innerText = score;
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').innerText = score;
    document.getElementById('gameOverPanel').classList.remove('hidden');
}

window.restartGame = function() {
    // Reset everything
    gameRunning = true;
    score = 0;
    difficulty = 1;
    frame = 0;
    player.y = 300;
    player.ySpeed = 0;
    player.isJumping = false;
    player.grounded = true;
    enemies = [];
    coins = [];
    enemySpawnDelay = 30;
    coinSpawnDelay = 20;
    updateScoreUI();
    document.getElementById('gameOverPanel').classList.add('hidden');
    requestAnimationFrame(gameLoop);
}

// Spawn enemy
function spawnEnemy() {
    enemies.push({
        x: canvas.width,
        y: groundY - 30,
        width: 35,
        height: 35,
        color: '#E63946'
    });
}

// Spawn coin
function spawnCoin() {
    coins.push({
        x: canvas.width,
        y: groundY - 50 - Math.random() * 40,
        width: 20,
        height: 20,
        color: '#F4D03F'
    });
}

// Collision detection (AABB)
function collide(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
        r2.x + r2.w < r1.x ||
        r2.y > r1.y + r1.h ||
        r2.y + r2.h < r1.y);
}

// Update logic
function updateGame() {
    if (!gameRunning) return;

    // ----- Difficulty increases with time -----
    difficulty = 1 + frame / 1800;  // slow increase over ~30 sec
    let currentEnemyDelay = Math.max(40, 80 - Math.floor(difficulty * 15));
    let currentCoinDelay = Math.max(30, 60 - Math.floor(difficulty * 10));

    // ----- Spawning enemies & coins -----
    if (enemySpawnDelay <= 0) {
        spawnEnemy();
        enemySpawnDelay = currentEnemyDelay;
    } else {
        enemySpawnDelay--;
    }

    if (coinSpawnDelay <= 0) {
        spawnCoin();
        coinSpawnDelay = currentCoinDelay;
    } else {
        coinSpawnDelay--;
    }

    // ----- Player Movement (Horizontal) -----
    let move = 0;
    if (leftPressed) move = -5;
    if (rightPressed) move = 5;
    player.x += move;
    // Boundaries
    if (player.x < 50) player.x = 50;
    if (player.x > canvas.width - 70) player.x = canvas.width - 70;

    // ----- Player Jump & Gravity -----
    player.ySpeed += gravity;
    player.y += player.ySpeed;

    // Ground collision
    if (player.y + player.height >= groundY) {
        player.y = groundY - player.height;
        player.ySpeed = 0;
        player.isJumping = false;
        player.grounded = true;
    } else {
        player.grounded = false;
    }

    // ----- Enemies update & collision -----
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        e.x -= (3 + difficulty * 1.5);  // enemies move faster with difficulty

        // Remove if offscreen left
        if (e.x + e.width < 0) {
            enemies.splice(i, 1);
            i--;
            continue;
        }

        // Collision with player
        if (collide(
            {x: player.x, y: player.y, w: player.width, h: player.height},
            {x: e.x, y: e.y, w: e.width, h: e.height}
        )) {
            gameOver();
            return;
        }
    }

    // ----- Coins update & collection -----
    for (let i = 0; i < coins.length; i++) {
        const c = coins[i];
        c.x -= (4 + difficulty);

        if (c.x + c.width < 0) {
            coins.splice(i, 1);
            i--;
            continue;
        }

        if (collide(
            {x: player.x, y: player.y, w: player.width, h: player.height},
            {x: c.x, y: c.y, w: c.width, h: c.height}
        )) {
            score += 10;
            updateScoreUI();
            coins.splice(i, 1);
            i--;
        }
    }

    frame++;
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = '#5D3A1A';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY + 5);
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, groundY - 5, canvas.width, 8);

    // Player (with simple face)
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 25, player.y + 10, 8, 8);
    ctx.fillRect(player.x + 5, player.y + 10, 8, 8);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(player.x + 15, player.y + 25, 10, 10);

    // Enemies
    for (let e of enemies) {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(e.x + 8, e.y + 10, 6, 6);
        ctx.fillRect(e.x + 20, e.y + 10, 6, 6);
    }

    // Coins
    for (let c of coins) {
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.ellipse(c.x + c.width/2, c.y + c.height/2, c.width/2, c.height/2, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(c.x + c.width/2, c.y + c.height/2, c.width/3, c.height/3, 0, 0, Math.PI*2);
        ctx.fill();
    }

    // Difficulty indicator
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.fillText('Difficulty: ' + difficulty.toFixed(1), canvas.width - 100, 30);
}

// ----- Controls (Keyboard + Mobile Touch) -----
function setupControls() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') leftPressed = true;
        if (e.key === 'ArrowRight') rightPressed = true;
        if (e.key === 'ArrowUp' && gameRunning && player.grounded) {
            player.ySpeed = jumpPower;
            player.isJumping = true;
            player.grounded = false;
            e.preventDefault();
        }
        if (e.key === ' ' && gameRunning && player.grounded) {
            player.ySpeed = jumpPower;
            player.isJumping = true;
            player.grounded = false;
            e.preventDefault();
        }
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') leftPressed = false;
        if (e.key === 'ArrowRight') rightPressed = false;
    });

    // Mobile touch buttons (on-screen area)
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
        const touchY = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);

        if (touchX < canvas.width / 2) {
            leftPressed = true;
        } else {
            rightPressed = true;
        }

        // Jump if tapping upper half
        if (touchY < canvas.height / 2 && gameRunning && player.grounded) {
            player.ySpeed = jumpPower;
            player.isJumping = true;
            player.grounded = false;
        }
    });
    canvas.addEventListener('touchend', (e) => {
        leftPressed = false;
        rightPressed = false;
    });
    canvas.addEventListener('touchcancel', () => {
        leftPressed = false;
        rightPressed = false;
    });
    
    // Mouse support for testing on desktop
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
        if (mouseX < canvas.width/2) leftPressed = true;
        else rightPressed = true;
        if (mouseY < canvas.height/2 && gameRunning && player.grounded) {
            player.ySpeed = jumpPower;
            player.isJumping = true;
            player.grounded = false;
        }
    });
    window.addEventListener('mouseup', () => {
        leftPressed = false;
        rightPressed = false;
    });
}

// Game Loop
function gameLoop() {
    updateGame();
    draw();
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    } else {
        // Game over, keep drawing but no update
        draw();
    }
}

// Initialize game
function init() {
    setupControls();
    updateScoreUI();
    gameLoop();
}

init();