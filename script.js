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

// === RESET ===
function resetGame() {
    snake = [{x: 5, y: 5}];
    initFoods();
}

// initialize
initFoods();

// === PATHFINDING (BFS) ===
function astar(start, goal) {
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
            if (snake.some(s => s.x === nx && s.y === ny)) continue;

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
    if (foods.length === 0) return null;

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

function isCollision(pos) {
    // wall
    if (pos.x < 0 || pos.y < 0 || pos.x >= gridSize || pos.y >= gridSize) {
        return true;
    }

    // self
    for (let i = 0; i < snake.length; i++) {
        if (pos.x === snake[i].x && pos.y === snake[i].y) {
            return true;
        }
    }

    return false;
}

function getSafeMove(head) {
    const dirs = [
        {x:1,y:0},
        {x:-1,y:0},
        {x:0,y:1},
        {x:0,y:-1}
    ];

    for (let d of dirs) {
        let next = {x: head.x + d.x, y: head.y + d.y};
        if (!isCollision(next)) return next;
    }

    return null;
}

// === DRAW ===
function drawCell(x,y,color){
    ctx.fillStyle = color;
    ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
}

function drawPath(path){
    if (!path || path.length === 0) return;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();

    path.forEach((p,i)=>{
        let px = p.x*cellSize + cellSize/2;
        let py = p.y*cellSize + cellSize/2;

        if(i===0) ctx.moveTo(px,py);
        else ctx.lineTo(px,py);
    });

    ctx.stroke();
}

// === UPDATE ===
function update() {
    let target = getClosestFood(snake[0]);
    let path = astar(snake[0], target);

    let nextMove;

    if (path.length > 1) {
        nextMove = path[1];

        // avoid death
        if (isCollision(nextMove)) {
            nextMove = getSafeMove(snake[0]);
        }
    } else {
        nextMove = getSafeMove(snake[0]);
    }

    // no safe move → reset
    if (!nextMove) {
        resetGame();
        return;
    }

    snake.unshift(nextMove);

    // collision after move → reset
    if (isCollision(snake[0])) {
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

    // keep 10 foods
    while (foods.length < 10) {
        foods.push(spawnFood());
    }
}

// === DRAW FRAME ===
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    foods.forEach(f => drawCell(f.x, f.y, "lime"));
    snake.forEach(s => drawCell(s.x, s.y, "white"));

    let target = getClosestFood(snake[0]);
    let path = astar(snake[0], target);
    drawPath(path);
}

// === LOOP ===
function loop(){
    update();
    draw();
}

setInterval(loop, 120);
