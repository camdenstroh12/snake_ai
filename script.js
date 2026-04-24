window.onerror = function(message, source, lineno, colno, error) {
    console.log("GAME ERROR:", message);
};

};
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const cellSize = canvas.width / gridSize;

let snake = [{x: 5, y: 5}];
let foods = [];

ctx.fillStyle = "white";
ctx.fillRect(50, 50, 50, 50);
// === FOOD ===
function spawnFood() {
    let newFood;

    do {
        newFood = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
        };
    } while (
        snake.some(s => s.x === newFood.x && s.y === newFood.y) ||
        foods.some(f => f.x === newFood.x && f.y === newFood.y)
    );

    return newFood;
}

// initialize 10 foods
for (let i = 0; i < 10; i++) {
    foods.push(spawnFood());
}

// === A* PATHFINDING ===
function astar(start, goal, snake) {
    if (!goal) return [];

    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const key = (x,y)=>`${x},${y}`;

    let open = [start];
    let cameFrom = {};
    let g = {};
    let f = {};

    g[key(start.x,start.y)] = 0;
    f[key(start.x,start.y)] = 0;

    while (open.length) {
        open.sort((a,b)=>f[key(a.x,a.y)]-f[key(b.x,b.y)]);
        let current = open.shift();

        if (!current) break;

        if (current.x===goal.x && current.y===goal.y) {
            let path=[current];
            let k=key(current.x,current.y);

            while(cameFrom[k]){
                current=cameFrom[k];
                k=key(current.x,current.y);
                path.push(current);
            }

            return path.reverse();
        }

        for (let [dx,dy] of dirs) {
            let nx=current.x+dx, ny=current.y+dy;

            if(nx<0||ny<0||nx>=gridSize||ny>=gridSize) continue;
            if(snake.some(s=>s.x===nx&&s.y===ny)) continue;

            let tentative = g[key(current.x,current.y)] + 1;
            let nk = key(nx,ny);

            if(tentative < (g[nk]||Infinity)){
                cameFrom[nk]=current;
                g[nk]=tentative;
                f[nk]=tentative + Math.abs(nx-goal.x)+Math.abs(ny-goal.y);

                if(!open.some(n=>n.x===nx&&n.y===ny)){
                    open.push({x:nx,y:ny});
                }
            }
        }
    }

    return [];
}
// === HELPERS ===
function getClosestFood(head, foods) {
    if (!foods.length) return null;

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

function buildFullPath(head, foods, snake) {
    if (!foods || foods.length === 0) return [];

    let remaining = [...foods];
    let current = head;
    let fullPath = [];

    while (remaining.length > 0) {
        let closest = remaining[0];

        for (let f of remaining) {
            let d1 = Math.abs(current.x - f.x) + Math.abs(current.y - f.y);
            let d2 = Math.abs(current.x - closest.x) + Math.abs(current.y - closest.y);
            if (d1 < d2) closest = f;
        }

        let segment = astar(current, closest, snake);
        if (!segment || segment.length === 0) break;

        if (fullPath.length > 0) segment.shift();

        fullPath = fullPath.concat(segment);
        current = closest;

        remaining = remaining.filter(f => f !== closest);
    }

    return fullPath;
}

// === DRAW HELPERS ===
function drawCell(x,y,color){
    ctx.fillStyle = color;
    ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
}

function drawPath(path){
    if (!path.length) return;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.beginPath();

    path.forEach((p,i)=>{
        let px = p.x*cellSize + cellSize/2;
        let py = p.y*cellSize + cellSize/2;

        if(i===0) ctx.moveTo(px,py);
        else ctx.lineTo(px,py);
    });

    ctx.stroke();
}

// === GAME LOGIC ===
function update() {
    if (!foods.length) return;

    let target = getClosestFood(snake[0], foods);
    if (!target) return;

    let path = astar(snake[0], target, snake);

    if (path.length > 1) {
        snake.unshift(path[1]);
    } else {
        return;
    }

    let ate = false;

    foods = foods.filter(f => {
        if (f.x === snake[0].x && f.y === snake[0].y) {
            ate = true;
            foods.push(spawnFood());
            return false;
        }
        return true;
    });

    if (!ate) {
        snake.pop();
    }
}

// === DRAW ===
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if (!foods.length) return;

    let fullPath = buildFullPath(snake[0], foods, snake);

    foods.forEach(f => drawCell(f.x, f.y, "lime"));
    snake.forEach(s => drawCell(s.x, s.y, "white"));

    drawPath(fullPath);
}

// === LOOP ===
function loop(){
    update();
    draw();
}

setInterval(loop, 120);
