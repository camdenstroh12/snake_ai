const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const cellSize = canvas.width / gridSize;

let snake = [{x: 5, y: 5}];
let foods = [];
let history = [];
let lastMove = {x: 1, y: 0};

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
    for (let i = 0; i < 10; i++) foods.push(spawnFood());
}

function resetGame() {
    snake = [{x: 5, y: 5}];
    history = [];
    lastMove = {x: 1, y: 0};
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

function isCollision(pos, body) {
    if (pos.x < 0 || pos.y < 0 || pos.x >= gridSize || pos.y >= gridSize) return true;
    return body.some(s => s.x === pos.x && s.y === pos.y);
}

// === SPACE CHECK (THIS WAS MISSING)
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

// === UPDATE (SMART + NON-LOOPING)
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

        let food = getClosestFood(next);
        let dist = Math.abs(next.x - food.x) + Math.abs(next.y - food.y);

        let space = getAvailableSpace(next, sim);

        let key = next.x + "," + next.y;

        let loopPenalty = history.includes(key) ? -100 : 0;

        let reversePenalty =
            (m.x === -lastMove.x && m.y === -lastMove.y) ? -200 : 0;

        let momentumBonus =
            (m.x === lastMove.x && m.y === lastMove.y) ? 30 : 0;

        let noise = Math.random() * 15;

        let score =
            -dist * 2 +
            space * 0.6 +
            momentumBonus +
            loopPenalty +
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

    history.push(nextMove.x + "," + nextMove.y);
    if (history.length > 30) history.shift();

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
    } else {
        snake.pop();
    }

    while (foods.length < 10) {
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

setInterval(loop, 100);
