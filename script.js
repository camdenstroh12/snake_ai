const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const cellSize = canvas.width / gridSize;

let snake = [{x: 5, y: 5}];
let foods = [];

function spawnFood() {
    return {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize)
    };
}

// create 10 foods initially
for (let i = 0; i < 10; i++) {
    foods.push(spawnFood());
}

// === A* PATHFINDING ===
function astar(start, goal, snake) {
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

// === DRAW ===
function drawCell(x,y,color){
    ctx.fillStyle=color;
    ctx.fillRect(x*cellSize,y*cellSize,cellSize,cellSize);
}

function drawPath(path){
    ctx.strokeStyle="red";
    ctx.lineWidth=3;
    ctx.beginPath();

    path.forEach((p,i)=>{
        let px=p.x*cellSize+cellSize/2;
        let py=p.y*cellSize+cellSize/2;
        if(i===0) ctx.moveTo(px,py);
        else ctx.lineTo(px,py);
    });

    ctx.stroke();
}

// === GAME LOOP ===
function update(){
    let path = astar(snake[0], food, snake);

    if(path.length > 1){
        snake.unshift(path[1]);
    }

    if(snake[0].x===food.x && snake[0].y===food.y){
        food = {
            x: Math.floor(Math.random()*gridSize),
            y: Math.floor(Math.random()*gridSize)
        };
    } else {
        snake.pop();
    }
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    let path = astar(snake[0], food, snake);

    drawCell(food.x,food.y,"lime");

    snake.forEach(s=>drawCell(s.x,s.y,"white"));

    drawPath(path);
}

function loop(){
    update();
    draw();
}

setInterval(loop,150);
