const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// 🎯 SETTINGS
const gridSize = 10;
const cellSize = canvas.width / gridSize;

const FOOD_COUNT = 4;
const STARVE_LIMIT = 40;

// 🟢 SCORE
let score = 0;
let highScore = 0;

let snake = [{x: 5, y: 5}];
let foods = [];
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
    highScore = Math.max(highScore, score);
    score = 0;

    snake = [{x: 5, y: 5}];
    stepsSinceFood = 0;
    initFoods();
}

initFoods();

// === HELPERS ===
function isCollision(pos, body) {
    if (pos.x < 0 || pos.y < 0 || pos.x >= gridSize || pos.y >= gridSize) return true;
    return body.some(s => s.x === pos.x && s.y === pos.y);
}

function getNeighbors(pos) {
    return [
        {x: pos.x+1, y: pos.y},
        {x: pos.x-1, y: pos.y},
        {x: pos.x, y: pos.y+1},
        {x: pos.x, y: pos.y-1}
    ];
}

// === BFS PATHFINDING ===
function bfs(start, targetCheck, body) {
    let queue = [[start]];
    let visited = new Set([start.x + "," + start.y]);

    while (queue.length) {
        let path = queue.shift();
        let current = path[path.length - 1];

        if (targetCheck(current)) return path;

        for (let n of getNeighbors(current)) {
            let key = n.x + "," + n.y;
            if (visited.has(key)) continue;
            if (isCollision(n, body)) continue;

            visited.add(key);
            queue.push([...path, n]);
        }
    }
    return null;
}

function canReachTail(head, body) {
    let tail = body[body.length - 1];
    return bfs(head, p => p.x === tail.x && p.y === tail.y, body.slice(0, -1));
}

function pathToFood(head, body) {
    return bfs(head, p => foods.some(f => f.x === p.x && f.y === p.y), body);
}

function pathToTail(head, body) {
    let tail = body[body.length - 1];
    return bfs(head, p => p.x === tail.x && p.y === tail.y, body.slice(0, -1));
}

// === UPDATE ===
function update() {
    let head = snake[0];

    if (stepsSinceFood > STARVE_LIMIT) {
        resetGame();
        return;
    }

    let foodPath = pathToFood(head, snake);

    if (foodPath && foodPath.length > 1) {
        let next = foodPath[1];

        let sim = [next, ...snake];
        sim.pop();

        if (canReachTail(next, sim) || stepsSinceFood > 20) {
            move(next);
            return;
        }
    }

    let tailPath = pathToTail(head, snake);

    if (tailPath && tailPath.length > 1) {
        move(tailPath[1]);
        return;
    }

    let neighbors = getNeighbors(head).filter(n => !isCollision(n, snake));

    if (neighbors.length > 0) {
        move(neighbors[Math.floor(Math.random() * neighbors.length)]);
    } else {
        resetGame();
    }
}

function move(nextMove) {
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
        score++;
    } else {
        snake.pop();
        stepsSinceFood++;
    }

    while (foods.length < FOOD_COUNT) {
        foods.push(spawnFood());
    }
}

// === DRAW CELL ===
function drawCell(x,y,color){
    ctx.fillStyle = color;
    ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
}

// === DRAW ===
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // FOOD
    foods.forEach(f => drawCell(f.x, f.y, "lime"));

    // SNAKE
    snake.forEach((s, i) => {
        if (i === 0) {
            // 🟡 HEAD
            ctx.fillStyle = "#FFD700";
        } else {
            // 🟢 BODY GRADIENT
            let t = i / snake.length;
            let shade = Math.floor(200 - t * 120);
            ctx.fillStyle = `rgb(0, ${shade}, 0)`;
        }

        ctx.fillRect(
            s.x * cellSize,
            s.y * cellSize,
            cellSize,
            cellSize
        );

        // outline
        ctx.strokeStyle = "black";
        ctx.strokeRect(
            s.x * cellSize,
            s.y * cellSize,
            cellSize,
            cellSize
        );
    });

    // SCORE UI
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, 180, 60);

    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    ctx.textBaseline = "top";

    ctx.fillText("Score: " + score, 10, 8);
    ctx.fillText("High: " + highScore, 10, 30);
}

// === LOOP ===
function loop(){
    update();
    draw();
}

setInterval(loop, 100);
