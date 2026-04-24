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

// start with 10 foods
for (let i = 0; i < 10; i++) {
    foods.push(spawnFood());
}

// === SIMPLE A* ===
function astar(start, goal) {
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

// === DRAW HELPERS ===
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

// === GET CLOSEST FOOD ===
function getClosestFood(head) {
    let best = foods[0];
    let bestDist = Infinity;

    foods.forEach(f => {
        let d = Math.abs(head.x - f.x) + Math.abs(head.y - f.y);
        if (d < bestDist) {
            bestDist = d;
            best = f;
        }
    });

    return best;
}

// === UPDATE ===
function update() {
    let target = getClosestFood(snake[0]);
    let path = astar(snake[0], target);

    // move snake
    if (path.length > 1) {
        snake.unshift(path[1]);
    } else {
        let h = snake[0];
        snake.unshift({x:(h.x+1)%gridSize, y:h.y});
    }

    let ateFood = false;

    // check eating
    for (let i = 0; i < foods.length; i++) {
        if (
            snake[0].x === foods[i].x &&
            snake[0].y === foods[i].y
        ) {
            ateFood = true;

            // remove eaten food
            foods.splice(i, 1);

            break;
        }
    }

    // spawn new food if eaten
    if (ateFood) {
        foods.push(spawnFood());
    } else {
        // normal movement
        snake.pop();
    }

    // 🔥 GUARANTEE 10 foods ALWAYS
    while (foods.length < 10) {
        foods.push(spawnFood());
    }
}
    // normal move
    snake.pop();
}
// === DRAW ===
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // foods
    foods.forEach(f => drawCell(f.x, f.y, "lime"));

    // snake
    snake.forEach(s => drawCell(s.x, s.y, "white"));

    // path to closest food ONLY (stable)
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
