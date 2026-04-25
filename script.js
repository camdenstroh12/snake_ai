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

function isCollision(pos, body) {
    if (pos.x < 0 || pos.y < 0 || pos.x >= gridSize || pos.y >= gridSize) return true;
    return body.some(s => s.x === pos.x && s.y === pos.y);
}

// === BFS PATH TO FOOD (KEY ADDITION) ===
function findPathToFood(start, body) {
    let queue = [[start]];
    let visited = new Set([start.x + "," + start.y]);

    while (queue.length) {
        let path = queue.shift();
        let current = path[path.length - 1];

        // check if food
        if (foods.some(f => f.x === current.x && f.y === current.y)) {
            return path;
        }

        let dirs = [
            {x:1,y:0},
            {x:-1,y:0},
            {x:0,y:1},
            {x:0,y:-1}
        ];

        for (let d of dirs) {
            let next = {x: current.x + d.x, y: current.y + d.y};
            let key = next.x + "," + next.y;

            if (visited.has(key)) continue;
            if (isCollision(next, body.slice(0, -1))) continue;

            visited.add(key);
            queue.push([...path, next]);
        }
    }

    return null;
}

// === SPACE CHECK ===
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

    // 🔥 LOOP BREAK MODE: force path to food
    if (stepsSinceFood > 60) {
        let path = findPathToFood(head, snake);
        if (path && path.length > 1) {
            let nextMove = path[1];

            snake.unshift(nextMove);
            lastMove = {x: nextMove.x - head.x, y: nextMove.y - head.y};

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

            return;
        }
    }

    // === NORMAL AI (your improved version) ===
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
        let normalizedSpace = space / (gridSize * gridSize);

        let edgePenalty =
            (next.x === 0 || next.y === 0 || next.x === gridSize-1 || next.y === gridSize-1)
            ? -25 : 0;

        let score =
            -dist * 3 +
            normalizedSpace * 80 +
            edgePenalty +
            Math.random() * 10;

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
