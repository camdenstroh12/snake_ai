const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const cellSize = canvas.width / gridSize;

let snake = [{x: 5, y: 5}];
let foods = [];
let lastMove = {x: 1, y: 0};

const FOOD_COUNT = 25;

let stepsSinceFood = 0;
const STARVE_LIMIT = 60;

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
    lastMove = {x: 1, y: 0};
    stepsSinceFood = 0;
    initFoods();
}

initFoods();

// === HELPERS ===
function isCollision(pos, body) {
    if (pos.x < 0 || pos.y < 0 || pos.x >= gridSize || pos.y >= gridSize) return true;
    return body.some(s => s.x === pos.x && s.y === pos.y);
}

function getClosestFoodDist(pos) {
    let best = Infinity;
    for (let f of foods) {
        let d = Math.abs(pos.x - f.x) + Math.abs(pos.y - f.y);
        if (d < best) best = d;
    }
    return best;
}

// 🔥 CAN REACH TAIL CHECK
function canReachTail(head, body) {
    let tail = body[body.length - 1];
    let visited = new Set();
    let queue = [head];

    while (queue.length) {
        let p = queue.shift();
        let key = p.x + "," + p.y;

        if (visited.has(key)) continue;
        visited.add(key);

        if (p.x === tail.x && p.y === tail.y) return true;

        let dirs = [[1,0],[-1,0],[0,1],[0,-1]];

        for (let [dx,dy] of dirs) {
            let nx = p.x + dx;
            let ny = p.y + dy;

            if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) continue;

            // allow tail (it moves)
            if (body.slice(0, -1).some(s => s.x === nx && s.y === ny)) continue;

            queue.push({x:nx,y:ny});
        }
    }

    return false;
}

// === UPDATE ===
function update() {
    let head = snake[0];

    if (stepsSinceFood > STARVE_LIMIT) {
        resetGame();
        return;
    }

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

        let dist = getClosestFoodDist(next);

        // 🔥 survival check
        let safe = canReachTail(next, sim);

        let reversePenalty =
            (m.x === -lastMove.x && m.y === -lastMove.y) ? -5 : 0;

        let momentum =
            (m.x === lastMove.x && m.y === lastMove.y) ? 2 : 0;

        let noise = Math.random() * 3;

        let score =
            -dist * 10 +          // aggressive food chasing
            (safe ? 0 : -80) +   // punish traps
            momentum +
            reversePenalty +
            noise;

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

    let ate = false;

    for (let i = 0; i < foods.length; i++) {
        if (nextMove.x === foods[i].x && nextMove.y === foods[i].y) {
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
