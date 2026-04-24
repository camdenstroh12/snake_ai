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
        snake.pop(); // ONLY happens if not eating
    }

    // guarantee 10 foods
    while (foods.length < 10) {
        foods.push(spawnFood());
    }
}
