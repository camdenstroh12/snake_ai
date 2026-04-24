const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const cellSize = canvas.width / gridSize;

let snake = [{x: 5, y: 5}];
let foods = [];

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
    for (let i = 0; i < 10; i++) {
        foods.push(spawnFood());
    }
}

function resetGame() {
    snake = [{x: 5, y: 5}];
    initFoods();
}

initFoods();

// === PATHFINDING ===
function astar(start, goal, body) {
    if (!goal) return [];

    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    let queue = [{pos: start, path: [start]}];
    let visited = new Set();

    while (queue.length) {
        let {pos, path} = queue.shift();
        let key = pos.x + "," + pos.y;

        if (visited.has(key)) continue;
        visited.add(key);

        if (pos.x === goal.x && pos.y === goal.y) {
            return path;
        }

        for (let [dx,dy] of dirs) {
            let nx = pos.x + dx;
            let ny = pos.y + dy;

            if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) continue;
            if (body.some(s => s.x === nx && s.y === ny)) continue;

            queue.push({
                pos: {x:nx,y:ny},
                path: [...path, {x:nx,y:ny}]
            });
        }
    }

    return [];
}

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

// === SIMULATION ===
function simulatePath(snake, path) {
    let sim = [...snake];

    for (let i = 1; i < path.length; i++) {
        sim.unshift(path[i]);
        sim.pop();
    }

    return sim;
}

// === TAIL FOLLOW ===
function getTailPath() {
    let tail = snake[snake.length - 1];
    return astar(snake[0], tail, snake);
}

// === SAFE MOVE ===
function getSafeMove() {
    const dirs = [
        {x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}
    ];

    for (let d of dirs) {
        let next = {x: snake[0].x + d.x, y: snake[0].y + d.y};
        if (!isCollision(next, snake)) return next;
    }

    return null;
}

// === UPDATE ===
const history = []; // track recent positions

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

function update() {
    let head = snake[0];

    const moves = [
        {x:1,y:0},
        {x:-1,y:0},
        {x:0,y:1},
        {x:0,y:-1}
    ];

    let bestMove = null;
    let bestScore = -Infinity;

    for (let m of moves) {
        let next = {x: head.x + m.x, y: head.y + m.y};

        // skip collisions
        if (isCollision(next, snake)) continue;

        // simulate snake
        let sim = [next, ...snake.slice(0, -1)];

        // distance to closest food
        let food = getClosestFood(next);
        let dist = Math.abs(next.x - food.x) + Math.abs(next.y - food.y);

        // available space after move
        let space = getAvailableSpace(next, sim);

        // loop penalty
        let key = next.x + "," + next.y;
        let loopPenalty = history.includes(key) ? -50 : 0;

        // scoring formula
        let score =
            -dist * 2 +     // prefer closer food
            space * 0.5 +   // prefer open space
            loopPenalty;    // avoid repetition

        if (score > bestScore) {
            bestScore = score;
            bestMove = next;
        }
    }

    // no move → reset
    if (!bestMove) {
        resetGame();
        return;
    }

    snake.unshift(bestMove);

    // track history (limit size)
    history.push(bestMove.x + "," + bestMove.y);
    if (history.length > 20) history.shift();

    // collision safety
    if (isCollision(snake[0], snake.slice(1))) {
        resetGame();
        return;
    }

    // eating
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

    // collision check
    if (isCollision(snake[0], snake.slice(1))) {
        return resetGame();
    }

    // eating
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

function drawPath(path){
    if (!path.length) return;

    ctx.strokeStyle = "red";
    ctx.beginPath();

    path.forEach((p,i)=>{
        let px = p.x*cellSize + cellSize/2;
        let py = p.y*cellSize + cellSize/2;
        if(i===0) ctx.moveTo(px,py);
        else ctx.lineTo(px,py);
    });

    ctx.stroke();
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    foods.forEach(f => drawCell(f.x, f.y, "lime"));
    snake.forEach(s => drawCell(s.x, s.y, "white"));

    let path = astar(snake[0], getClosestFood(snake[0]), snake);
    drawPath(path);
}

// === LOOP ===
function loop(){
    update();
    draw();
}

setInterval(loop, 100);
