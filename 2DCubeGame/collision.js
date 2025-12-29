// Handle collisions between different shapes in a 2D space


// sq to sq collision
function sqToSqCollision(sq1, sq2) {
    return !(sq1.x > sq2.x + sq2.width || sq1.x + sq1.width < sq2.x || sq1.y > sq2.y + sq2.height || sq1.y + sq1.height < sq2.y);
}

function sqToCircleCollision(sq, circle) {
    const closestX = Math.max(sq.x, Math.min(circle.x, sq.x + sq.width));
    const closestY = Math.max(sq.y, Math.min(circle.y, sq.y + sq.height));
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
}

function circleToCircleCollision(circle1, circle2) {
    const distance = Math.sqrt(Math.pow(circle2.x - circle1.x, 2) + Math.pow(circle2.y - circle1.y, 2));
    return distance < (circle1.radius + circle2.radius);
}

// tilemap collision detection
function tileMapToSqCollision(tileMap, tileType, sq) {
    // get the tile type of the tile at the position of the square
    const tileX = Math.floor((sq.x + sq.width / 2) / tileMap.tileSize);
    const tileY = Math.floor((sq.y + sq.height / 2) / tileMap.tileSize);
    const tile = tileMap.getTile(tileX, tileY);
}