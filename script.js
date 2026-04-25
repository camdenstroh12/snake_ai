const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const cellSize = canvas.width / gridSize;

let snake = [{x: 5, y: 5}];
let foods = [];
let history = [];
let lastMove = {x: 1, y: 0};

const FOOD_COUNT = 25;
let stepsSinceFood = 0;

// === FOOD ===
function spawnFood() {
    let f;
    do {
        f = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
        };
    } while (
        snake.some(s => s.x === f.x && s.y === f.y) ||
        foods.some(o => o.x === f.x && o.y === f.y)
    );
    return f;
}

function initFoods() {
    foods = [];
    for (let i = 0; i < FOOD_COUNT; i++) foods.push(spawnFood());
}

function resetGame() {
    snake = [{x: 5, y: 5}];
    history = [];
    lastMove = {x: 1, y: 0};
    stepsSinceFood = 0;
    initFoods();
}

initFoods();

// === HELPERS ===
function getClosestFood(head) {
    let best = foods[0];
    let bestDist = Infinity;

    for (let f of foods) {
        let d = Math.abs(head.x - f.x) + Math.abs(head.y - f.y);
        if (d < bestDist) {
            bestDist = d;
            best = f;
        }
    }
    return best;
}

function getAnyFoodDist(pos) {
    let best = Infinity;
    for (let f of foods) {
        let d = Math.abs(pos.x - f.x) + Math.abs(pos.y - f.y);
        if (d < best) best = d;
    }
    return best;
}

function isCollision(pos, body) {
    if (pos.x < 0 || pos.y < 0 || pos.x >= gridSize || pos.y >= gridSize) return true;
    return body.some(s => s.x === pos.x && s.y === pos.y);
}

// === SPACE ===
function getAvailableSpace(start, body) {
    let visited = new Set();
    let queue = [start];

    while (queue.length) {
        let p = queue.shift();
        let key = p.x + "," + p.y;

        if (visited.has(key)) continue;
        visited.add(key);

        let dirs = [[1,0],[-1,0],[0,1],[0,-1]];

        for (let [dx,dy] of dirs) {
            let nx = p.x + dx;
            let ny = p.y + dy;

            if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) continue;
            if (body.some(s => s.x === nx && s.y === ny)) continue;

            queue.push({x:nx,y:ny});
        }
    }

    return visited.size;
}

// === UPDATE ===
function update() {
    let head = snake[0];

    const moves = [
        {x:1,y:0},
        {x:-1,y:0},
        {x:0,y:1},
        {x:0,y:-1}
    ];

    let bestMoves = [];
    let bestScore = -Infinity;

    for (let m of moves) {
        let next = {x: head.x + m.x, y: head.y + m.y};

        if (isCollision(next, snake)) continue;

        let sim = [next, ...snake.slice(0, -1)];

        let dist = getAnyFoodDist(next);
        let space = getAvailableSpace(next, sim);
        let normalizedSpace = space / (gridSize * gridSize);

        let edgePenalty =
            (next.x === 0 || next.y === 0 || next.x === gridSize-1 || next.y === gridSize-1)
            ? -20 : 0;

        let freq = history.filter(h => h === next.x + "," + next.y).length;
        let loopPenalty = -freq * 30;

        let noise = Math.random() * 5;

        // 🔥 AGGRESSION MODE
        let aggressive = stepsSinceFood > 40;
        let forceEat = stepsSinceFood > 80;

        let score;

        if (forceEat) {
            // 🚨 FULL SEND MODE (ignore safety)
            score = -dist * 10 + noise;
        }
        else if (aggressive) {
            // ⚡ RISKY MODE
            score =
                -dist * 5 +
                normalizedSpace * 20 +
                loopPenalty +
                noise;
        }
        else {
            // 🧠 NORMAL MODE
            score =
                -dist * 3 +
                normalizedSpace * 60 +
                loopPenalty +
                edgePenalty +
                noise;
        }

        if (score > bestScore) {
            bestScore = score;
            bestMoves = [m];
        } else if (score === bestScore) {
            bestMoves.push(m);
        }
    }

    if (bestMoves.length === 0) {
        resetGame();
        return;
    }

    let chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    let nextMove = {x: head.x + chosen.x, y: head.y + chosen.y};

    lastMove = chosen;
    snake.unshift(nextMove);

    history.push(nextMove.x + "," + nextMove.y);
    if (history.length > 50) history.shift();

    if (isCollision(snake[0], snake.slice(1))) {
        resetGame();
        return;
    }

    let ate = false;

    for (let i = 0; i < foods.length; i++) {
        if (snake[0].x === foods[i].x && snake[0].y === foods[i].y) {
            foods.splice(i, 1);
            ate = true;
            break;
        }
    }

    if (ate) {
        foods.push(spawnFood());
        stepsSinceFood = 0;
    } else {
        snake.pop();
        stepsSinceFood++;
    }

    while (foods.length < FOOD_COUNT) {
        foods.push(spawnFood());
    }
}

// === DRAW ===
function drawCell(x,y,color){
    ctx.fillStyle = color;
    ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    foods.forEach(f => drawCell(f.x, f.y, "lime"));
    snake.forEach(s => drawCell(s.x, s.y, "white"));
}

// === LOOP ===
function loop(){
    update();
    draw();
}

setInterval(loop, 33);
