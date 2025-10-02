// Get game timer
const startTime = Date.now();

// time based off computer not fps
let lastTime = performance.now();

// Select the canvas and get the 2D rendering context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size to fill the window
canvas.width = window.innerHeight - 50; // actuall size is # - 50px
canvas.height = window.innerHeight - 50; // Adjust height to fit the window, leaving space for other UI elements

// Define the game world
const gameWorld = {
    widthGU: 100, // Game world width in game units
    heightGU: 100, // Game world height in game units
    // Set the background color and border color
    color: '#18191A',
    borderColor: 'black',
    quadrents: {
        topLeft: { xGU: 0, yGU: 0, widthGU: 50, heightGU: 50 },
        topRight: { xGU: 50, yGU: 0, widthGU: 50, heightGU: 50 },
        bottomLeft: { xGU: 0, yGU: 50, widthGU: 50, heightGU: 50 },
        bottomRight: { xGU: 50, yGU: 50, widthGU: 50, heightGU: 50 },
    },
}
let GUtoPxX = canvas.width / gameWorld.widthGU; // Conversion factor from game units to pixels in X direction
let GUtoPxY = canvas.height / gameWorld.heightGU; // Conversion factor from game units to pixels in Y direction

const gameGrid = {
    rows: 10, // Number of rows in the grid
    cols: 10, // Number of columns in the grid
    cellWidth: gameWorld.widthGU * GUtoPxX / 10, // Width of each cell
    cellHeight: gameWorld.heightGU * GUtoPxY / 10, // Height of each cell

};

// Pausing Boolean
let isPaused = false;
let pauseMenus = {
    normalPause: false,
    upgrade: false,
    gameOver: false,
};

class Player {
    constructor(x, y) {
        // Player properties
        this.xGU = x;
        this.yGU = y;
        this.widthGU = 5;
        this.heightGU = 5;
        this.color = 'red';

        // movement properties
        this.accelerationGU = 2.0; // accel in GU per seconds^2
        this.speedGU = 0.2;
        this.maxSpeedGU = 0.5;
        this.friction = 0.015;
        this.dxGU = 0;
        this.dyGU = 0;

        // health properties
        this.health = 100; // Player health
        this.maxHealth = 100; // Maximum health

        // sprint properties
        this.sprint = {
            button: 'Shift', // Key to activate sprint
            active: false,
            currentAmount: 100,
            maxAmount: 100,
            rechargeRate: 10, // Amount per second
            sprintSpeed: 1.75, // Speed multiplier when sprinting
        };

        // sight properties
        this.sight = {
            centerX: xGU => xGU + this.widthGU / 2, // Function to calculate center X position
            centerY: yGU => yGU + this.heightGU / 2, // Function to calculate center Y position
            lookingAngle: 0, // Angle based on movement direction
            lastAngle: 0, // Last angle for smooth rotation
        };

        // bullet properties
        this.bullet = {
            damage: 5,
            rangeGU: 25, // Range in pixels
            fireRate: 433, // Fire rate in milliseconds
            shotSpeedxGU: 0.7, // Speed of the bullet
            shotSpeedyGU: 0.7, // Speed of the bullet
            lastshot: 0, // Last shot time
            angleShot: 0, // Angle of the shot

            // Bullet dimensions
            color: 'cyan',
            widthGU: 2,
            heightGU: 1,
        };
    }

    sprinitRecharge(deltaTime) {
        // Recharge sprint amount if not active and below max amount
        if (this.sprint.currentAmount < this.sprint.maxAmount && !this.sprint.active) {
            // Recharge sprint amount at the defined rate
            this.sprint.currentAmount += this.sprint.rechargeRate * deltaTime; // Recharge per frame
            if (this.sprint.currentAmount > this.sprint.maxAmount) {
                this.sprint.currentAmount = this.sprint.maxAmount; // Cap at max amount
            }
        }
    }

    // Movement
    move(deltaTime, keys) {
        // accelration
        const accel = this.accelerationGU * deltaTime;
        // Declare movement flags at the start of the function
        let movingX = false;
        let movingY = false;

        if (keys.has(this.sprint.button.toLowerCase())) {
            // Activate sprint if the key is pressed and current amount is greater than 0
            if (this.sprint.currentAmount > 0) {
                this.sprint.active = true; // Activate sprint
            } else {
                this.sprint.active = false; // Deactivate sprint if no amount left
            }
        } else
            this.sprint.active = false; // Deactivate sprint if the key is not pressed
        // Handle sprint cooldown
        sprintHandling(deltaTime);

        // Horizontal movement
        if (keys.has('a') && !keys.has('d')) {
            this.dxGU -= accel * (this.sprint.active ? this.sprint.sprintSpeed : 1);
            this.sprint.currentAmount -= (this.sprint.active && this.sprint.currentAmount > 0 ? this.sprint.rechargeRate * deltaTime : 0);
            movingX = true;
        } else if (keys.has('d') && !keys.has('a')) {
            this.dxGU += accel * (this.sprint.active ? this.sprint.sprintSpeed : 1);
            this.sprint.currentAmount -= (this.sprint.active && this.sprint.currentAmount > 0 ? this.sprint.rechargeRate * deltaTime : 0);
            movingX = true;
        }
        // Vertical movement
        if (keys.has('w') && !keys.has('s')) {
            this.dyGU -= accel * (this.sprint.active ? this.sprint.sprintSpeed : 1);
            this.sprint.currentAmount -= (this.sprint.active && this.sprint.currentAmount > 0 ? this.sprint.rechargeRate * deltaTime : 0);
            movingY = true;
        } else if (keys.has('s') && !keys.has('w')) {
            this.dyGU += accel * (this.sprint.active ? this.sprint.sprintSpeed : 1);
            this.sprint.currentAmount -= (this.sprint.active && this.sprint.currentAmount > 0 ? this.sprint.rechargeRate * deltaTime : 0);
            movingY = true;
        }

        // Apply max speed limit
        if (!this.sprint.active) {
            this.dxGU = Math.max(-this.maxSpeedGU, Math.min(this.maxSpeedGU, this.dxGU));
            this.dyGU = Math.max(-this.maxSpeedGU, Math.min(this.maxSpeedGU, this.dyGU));
        } else {
            this.dxGU = Math.max(-this.maxSpeedGU * this.sprint.sprintSpeed, Math.min(this.maxSpeedGU * this.sprint.sprintSpeed, this.dxGU));
            this.dyGU = Math.max(-this.maxSpeedGU * this.sprint.sprintSpeed, Math.min(this.maxSpeedGU * this.sprint.sprintSpeed, this.dyGU));
        }


        // Apply friction when no movement input
        const frictionFactor = Math.pow(this.friction, deltaTime * 60); // normalize to 60fps
        if (!movingX) this.dxGU *= frictionFactor;
        if (!movingY) this.dyGU *= frictionFactor;

        // Apply
        this.xGU += this.dxGU;
        this.yGU += this.dyGU;
    }

    shoot(bullets) {
        const now = Date.now();

        // calculate the range boost on the bullet based on the player's current speed
        const rangeBoost = 1 + (Math.abs(this.dxGU) + Math.abs(this.dyGU)) * 0.75;

        // Check if enough time has passed since the last shot
        if (now - this.bullet.lastshot >= this.bullet.fireRate) {
            // Create a new bullet object
            const bullet = {
                xGU: this.xGU + this.widthGU / 2 - this.bullet.widthGU / 2,
                yGU: this.yGU + this.heightGU / 2 - this.bullet.heightGU / 2,
                dxGU: 0, // Set initial horizontal speed
                dyGU: 0, // Set initial vertical speed
                widthGU: this.bullet.widthGU,
                heightGU: this.bullet.heightGU,
                ColorManagement: this.bullet.color,
                aspects: {
                    damage: this.bullet.damage,
                    rangeGU: this.bullet.rangeGU * rangeBoost, // Range in pixels
                    shotSpeedxGU: this.bullet.shotSpeedxGU + Math.abs(this.dxGU), // Speed of the bullet
                    shotSpeedyGU: this.bullet.shotSpeedyGU + Math.abs(this.dyGU), // Speed of the bullet
                    thisXspeedGU: this.dxGU / 2, // player's horizontal speed
                    thisYspeedGU: this.dyGU / 2, // player's vertical speed
                    lastshot: this.bullet.lastshot, // Last shot time
                    angleShot: this.sight.lookingAngle, // Angle of the shot
                }
            };
            // rotate the bullet based on the this's looking direction
            bullets.push(bullet); // Add bullet to the array
            this.bullet.lastshot = now; // Update last shot time
        }
    }

    draw(ctx) {
        // Draw sight line
        ctx.beginPath();
        ctx.moveTo(
            this.sight.centerX(this.xGU) * GUtoPxX,
            this.sight.centerY(this.yGU) * GUtoPxY
        );
        // Draw a line in the direction the player is looking
        ctx.lineTo(
            (this.sight.centerX(this.xGU) + Math.cos(this.sight.lookingAngle) * this.bullet.rangeGU) * GUtoPxX,
            (this.sight.centerY(this.yGU) + Math.sin(this.sight.lookingAngle) * this.bullet.rangeGU) * GUtoPxY
        );
        ctx.strokeStyle = 'yellow'; // Line color
        ctx.lineWidth = 2; // Line thickness
        ctx.stroke();
        ctx.closePath();

        // Draw circlur range
        ctx.beginPath();
        ctx.arc(
            this.sight.centerX(this.xGU) * GUtoPxX,
            this.sight.centerY(this.yGU) * GUtoPxY,
            this.bullet.rangeGU * GUtoPxX, // Radius in pixels
            0,
            2 * Math.PI
        );
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Circle color with transparency
        ctx.lineWidth = 1; // Circle thickness
        ctx.stroke();
        ctx.closePath();

        // Draw the player as a rectangle
        ctx.fillStyle = this.color;
        ctx.fillRect(this.xGU * GUtoPxX, this.yGU * GUtoPxY, this.widthGU * GUtoPxX, this.heightGU * GUtoPxY);
        ctx.strokeStyle = "white";
        ctx.strokeRect(this.xGU * GUtoPxX, this.yGU * GUtoPxY, this.widthGU * GUtoPxX, this.heightGU * GUtoPxY);
    }
}

let bullets = []; // Array to hold bullets

// Define player properties
let player = new Player(gameWorld.widthGU / 2 - 2.5, gameWorld.heightGU / 2 - 2.5);

let enemies = []; // Array to hold enemies
// define target properties
let target = {
    tag: 'enemy', // Target tag
    xGU: 0, // Initial X position in game units
    yGU: 0, // Initial Y position in game units
    dxGU: 0, // Initial horizontal speed
    dyGU: 0, // Initial vertical speed
    widthGU: 5,
    heightGU: 5,
    speedGU: 0.1, // Speed of the target
    maxSpeedGU: 0.2, // Maximum speed of the target
    color: 'rgba(255, 255, 0, 1)', // Semi-transparent red color
    health: 25, // Target health
    maxHealth: 25, // Maximum health
    limit: 3, // Maximum number of targets
    spawnRate: 500, // Spawn rate in milliseconds
};

// Movement keys
const keys = new Set();

// Listen for keyboard events
document.addEventListener("keydown", (event) => keys.add(event.key.toLowerCase()));
document.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

// Listen for keyboard even to trigger pausing
document.addEventListener("keypress", (event) => {
    const key = event.key.toLowerCase();
    keys.add(key);

    if (event.key === "p" && !pauseMenus.gameOver) {
        isPaused = !isPaused;
        pauseMenus.normalPause = !pauseMenus.normalPause;
    }
});

// function for sprint cooldown
// unused due to being in player class
function sprintHandling(deltaTime) {
    // Recharge sprint amount if not active and below max amount
    // This allows the player to recharge sprint amount when not actively sprinting
    if (player.sprint.currentAmount < player.sprint.maxAmount && !player.sprint.active) {
        // Recharge sprint amount at the defined rate
        player.sprint.currentAmount += player.sprint.rechargeRate * deltaTime; // Recharge per frame
        if (player.sprint.currentAmount > player.sprint.maxAmount) {
            player.sprint.currentAmount = player.sprint.maxAmount; // Cap at max amount
        }
    }
}

// unused due to being in player class
function movePlayer(deltaTime) {
    // accelration
    const accel = player.accelerationGU * deltaTime;
    // Declare movement flags at the start of the function
    let movingX = false;
    let movingY = false;

    if (keys.has(player.sprint.button.toLowerCase())) {
        // Activate sprint if the key is pressed and current amount is greater than 0
        if (player.sprint.currentAmount > 0) {
            player.sprint.active = true; // Activate sprint
        } else {
            player.sprint.active = false; // Deactivate sprint if no amount left
        }
    } else
        player.sprint.active = false; // Deactivate sprint if the key is not pressed
    // Handle sprint cooldown
    sprintHandling(deltaTime);

    // Horizontal movement
    if (keys.has('a') && !keys.has('d')) {
        player.dxGU -= accel * (player.sprint.active ? player.sprint.sprintSpeed : 1);
        player.sprint.currentAmount -= (player.sprint.active && player.sprint.currentAmount > 0 ? player.sprint.rechargeRate * deltaTime : 0);
        movingX = true;
    } else if (keys.has('d') && !keys.has('a')) {
        player.dxGU += accel * (player.sprint.active ? player.sprint.sprintSpeed : 1);
        player.sprint.currentAmount -= (player.sprint.active && player.sprint.currentAmount > 0 ? player.sprint.rechargeRate * deltaTime : 0);
        movingX = true;
    }
    // Vertical movement
    if (keys.has('w') && !keys.has('s')) {
        player.dyGU -= accel * (player.sprint.active ? player.sprint.sprintSpeed : 1);
        player.sprint.currentAmount -= (player.sprint.active && player.sprint.currentAmount > 0 ? player.sprint.rechargeRate * deltaTime : 0);
        movingY = true;
    } else if (keys.has('s') && !keys.has('w')) {
        player.dyGU += accel * (player.sprint.active ? player.sprint.sprintSpeed : 1);
        player.sprint.currentAmount -= (player.sprint.active && player.sprint.currentAmount > 0 ? player.sprint.rechargeRate * deltaTime : 0);
        movingY = true;
    }

    // Apply max speed limit
    if (!player.sprint.active) {
        player.dxGU = Math.max(-player.maxSpeedGU, Math.min(player.maxSpeedGU, player.dxGU));
        player.dyGU = Math.max(-player.maxSpeedGU, Math.min(player.maxSpeedGU, player.dyGU));
    } else {
        player.dxGU = Math.max(-player.maxSpeedGU * player.sprint.sprintSpeed, Math.min(player.maxSpeedGU * player.sprint.sprintSpeed, player.dxGU));
        player.dyGU = Math.max(-player.maxSpeedGU * player.sprint.sprintSpeed, Math.min(player.maxSpeedGU * player.sprint.sprintSpeed, player.dyGU));
    }


    // Apply friction when no movement input
    const frictionFactor = Math.pow(player.friction, deltaTime * 60); // normalize to 60fps
    if (!movingX) player.dxGU *= frictionFactor;
    if (!movingY) player.dyGU *= frictionFactor;
}

// determine where the player is looking
// in used for shooting direction
function handlePlayerLookingDirection() {
    const cx = player.sight.centerX(player.xGU);
    const cy = player.sight.centerY(player.yGU);

    let targetAngle = player.sight.lookingAngle;

    // Check for closest enemy in range
    const closestEnemy = enemies.reduce((closest, enemy) => {
        const ex = enemy.xGU + enemy.widthGU / 2;
        const ey = enemy.yGU + enemy.heightGU / 2;
        const dist = Math.hypot(ex - cx, ey - cy);
        if (dist < player.bullet.rangeGU && (!closest || dist < closest.distance)) {
            return { enemy, distance: dist };
        }
        return closest;
    }, null);

    if (closestEnemy) {
        const ex = closestEnemy.enemy.xGU + closestEnemy.enemy.widthGU / 2;
        const ey = closestEnemy.enemy.yGU + closestEnemy.enemy.heightGU / 2;
        targetAngle = Math.atan2(ey - cy, ex - cx);
    } else if (player.dxGU !== 0 || player.dyGU !== 0) {
        targetAngle = Math.atan2(player.dyGU, player.dxGU);
    }

    // Normalize angle to [-PI, PI]
    targetAngle = ((targetAngle + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

    // Optional: Smooth rotation (if needed)
    const smoothing = 0.5;
    player.sight.lookingAngle = player.sight.lastAngle + smoothing * (targetAngle - player.sight.lastAngle);
    player.sight.lastAngle = player.sight.lookingAngle;
}

function handleRectCollision(rect1, rect2) {
    // Check for collision between two rectangles
    return (
        rect1.xGU < rect2.xGU + rect2.widthGU &&
        rect1.xGU + rect1.widthGU > rect2.xGU &&
        rect1.yGU < rect2.yGU + rect2.heightGU &&
        rect1.yGU + rect1.heightGU > rect2.yGU
    );
}

function handleCircleCollision(circle, rect) {
    // Check for collision between a circle and a rectangle
    // Use the average of widthGU and heightGU as the circle's radius for better accuracy
    const circleRadius = (circle.widthGU + circle.heightGU) / 4;
    const circleDistanceX = Math.abs(circle.xGU - (rect.xGU + rect.widthGU / 2));
    const circleDistanceY = Math.abs(circle.yGU - (rect.yGU + rect.heightGU / 2));
    const halfWidth = rect.widthGU / 2;
    const halfHeight = rect.heightGU / 2;
    // Check if the circle is within the rectangle's bounds
    if (circleDistanceX > (halfWidth + circleRadius) ||
        circleDistanceY > (halfHeight + circleRadius)) {
        return false; // No collision
    }
    // Check if the circle is within the rectangle's corners
    if (circleDistanceX <= halfWidth || circleDistanceY <= halfHeight) {
        return true; // Collision detected
    }
    // Check for collision with rectangle corners
    const cornerDistanceSq = (circleDistanceX - halfWidth) * (circleDistanceX - halfWidth) +
        (circleDistanceY - halfHeight) * (circleDistanceY - halfHeight);
    return cornerDistanceSq <= (circleRadius * circleRadius); // Collision if within circle radius
}

// Function to hanlde bullet Collision with certain objects
function handlePlayerBulletCollision() {
    bullets = bullets.filter(bullet => {
        let hitSomething = false;

        for (let enemy of enemies) {
            if (handleRectCollision(bullet, enemy)) {
                // Bullet hit an enemy
                enemy.health -= bullet.aspects.damage;

                // Remove enemy if its health is depleted
                if (enemy.health <= 0) {
                    enemies = enemies.filter(e => e !== enemy);
                }
                hitSomething = true;
                break; // Bullet hit something, stop checking more enemies
            }
        }
        // Return false to remove the bullet if it hit something
        return !hitSomething;
    });
}

// Funtion to handle players position within a quadrent
// stop player from being in multiple quadrents at once
function handlePlayerQuadrent(quadrent) {
    // Check which quadrent the player is in
    let playerCenter = {
        xGU: player.sight.centerX(player.xGU),
        yGU: player.sight.centerY(player.yGU),
        widthGU: 0.5, // Adjusted for better detection
        heightGU: 0.5, // Adjusted for better detection
    };
    // Loop through each quadrent to find the one the player is in
    if (handleRectCollision(playerCenter, quadrent)) {
        return true; // Player is in a quadrent
    }
    return false; // Player is not in any quadrent
}

// Function to handle player shooting
function createBullet() {
    const now = Date.now();

    // calculate the range boost on the bullet based on the player's current speed
    rangeBoost = 1 + (Math.abs(player.dxGU) + Math.abs(player.dyGU)) * 0.75;

    // Check if enough time has passed since the last shot
    if (now - player.bullet.aspects.lastshot >= player.bullet.aspects.fireRate) {
        // Create a new bullet object
        const bullet = {
            xGU: player.xGU + player.widthGU / 2 - player.bullet.aspects.widthGU / 2,
            yGU: player.yGU + player.heightGU / 2 - player.bullet.aspects.heightGU / 2,
            dxGU: 0, // Set initial horizontal speed
            dyGU: 0, // Set initial vertical speed
            widthGU: player.bullet.aspects.widthGU,
            heightGU: player.bullet.aspects.heightGU,
            ColorManagement: player.bullet.aspects.color,
            aspects: {
                damage: player.bullet.aspects.damage,
                rangeGU: player.bullet.aspects.rangeGU * rangeBoost, // Range in pixels
                shotSpeedxGU: player.bullet.aspects.shotSpeedxGU + Math.abs(player.dxGU), // Speed of the bullet
                shotSpeedyGU: player.bullet.aspects.shotSpeedyGU + Math.abs(player.dyGU), // Speed of the bullet
                playerXspeedGU: player.dxGU / 2, // Player's horizontal speed
                playerYspeedGU: player.dyGU / 2, // Player's vertical speed
                lastshot: player.bullet.aspects.lastshot, // Last shot time
                angleShot: player.sight.lookingAngle, // Angle of the shot
            }
        };
        // rotate the bullet based on the player's looking direction
        bullets.push(bullet); // Add bullet to the array
        player.bullet.aspects.lastshot = now; // Update last shot time
    }
}

// Function to update bullet positions and check for firing rate
function updateBullets() {
    bullets = bullets.filter(bullet => {
        // Initialize distanceTraveled if not present
        if (typeof bullet.distanceTraveledGU === 'undefined') {
            bullet.distanceTraveledGU = 0;
        }

        // Update bullet position based on its speed and angle
        bullet.dxGU = Math.cos(bullet.aspects.angleShot) * bullet.aspects.shotSpeedxGU;
        bullet.dyGU = Math.sin(bullet.aspects.angleShot) * bullet.aspects.shotSpeedyGU;
        bullet.xGU += bullet.dxGU;
        bullet.yGU += bullet.dyGU;
        // Update distance traveled
        bullet.distanceTraveledGU += Math.sqrt(bullet.dxGU * bullet.dxGU + bullet.dyGU * bullet.dyGU);
        // check if the bullet is within the canvas bounds
        if (bullet.xGU < 0 || bullet.xGU + bullet.widthGU > gameWorld.widthGU || bullet.yGU < 0 || bullet.yGU + bullet.heightGU > gameWorld.heightGU) {
            return false; // Remove bullet if it goes out of bounds
        }
        // Remove bullet if it exceeds its range
        return bullet.distanceTraveledGU <= bullet.aspects.rangeGU;
    });
    handlePlayerBulletCollision(); // Check for bullet collisions with targets
}

function handleEnemySpawning() {
    if (enemies.length < target.limit) {
        // Step 1: Find which quadrant the player is in
        let playerQuadrant = null;
        for (const [name, quad] of Object.entries(gameWorld.quadrents)) {
            if (handlePlayerQuadrent(quad)) {
                playerQuadrant = name;
                break;
            }
        }

        // Step 2: Get possible quadrants to spawn in (excluding player’s)
        const availableQuadrants = Object.entries(gameWorld.quadrents).filter(
            ([name]) => name !== playerQuadrant
        );
        if (availableQuadrants.length === 0) return; // Just in case

        // Step 3: Randomly select one of the remaining quadrants
        const [_, selectedQuadrant] = availableQuadrants[Math.floor(Math.random() * availableQuadrants.length)];

        // Step 4: Try to spawn an enemy inside the selected quadrant
        const margin = 2; // Avoid edge clipping
        const newEnemy = {
            tag: target.tag,
            xGU: selectedQuadrant.xGU + margin + Math.random() * (selectedQuadrant.widthGU - target.widthGU - 2 * margin),
            yGU: selectedQuadrant.yGU + margin + Math.random() * (selectedQuadrant.heightGU - target.heightGU - 2 * margin),
            widthGU: target.widthGU,
            heightGU: target.heightGU,
            color: target.color,
            health: target.health,
            maxHealth: target.maxHealth,
        };

        // Ensure new enemy does not overlap with player or another enemy
        let validPosition = !handleRectCollision(newEnemy, player);
        for (let enemy of enemies) {
            if (handleRectCollision(newEnemy, enemy)) {
                validPosition = false;
                break;
            }
        }

        // Ensure attempts to spawn is limited
        let attempts = 10;
        while (attempts-- > 0) {
            // try spawn logic
            if (validPosition) {
                enemies.push(newEnemy);
                break;
            }
        }
    }
}

// Function to handle enemy spawning at regular intervals
function spawnEnemies() {
    // Set an interval to spawn enemies at the defined rate
    setInterval(handleEnemySpawning, target.spawnRate);
    // This will continuously check and spawn enemies at the specified rate
    // Note: This function should be called once, not every frame
}

function moveEnemiesTowardsPlayer() {
    // Calculate center positions
    const playerCenterX = player.xGU + player.widthGU / 2;
    const playerCenterY = player.yGU + player.heightGU / 2;

    enemies.forEach(enemy => {
        // Calculate center positions
        const enemyCenterX = enemy.xGU + enemy.widthGU / 2;
        const enemyCenterY = enemy.yGU + enemy.heightGU / 2;

        // Calculate direction to player
        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize direction
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;

        // Move enemy toward player
        const speed = target.speedGU; // or set per enemy
        enemy.xGU += normalizedX * speed;
        enemy.yGU += normalizedY * speed;

        enemy.dxGU = Math.max(-enemy.maxSpeedGU, Math.min(enemy.maxSpeedGU, enemy.dxGU));
        enemy.dyGU = Math.max(-enemy.maxSpeedGU, Math.min(enemy.maxSpeedGU, enemy.dyGU));
    });
}

function EnemyContactDmg() {
    enemies.forEach(enemy => {
        if (handleRectCollision(enemy, player)) {
            player.health -= enemy.health;
            enemy.health -= 10;
            if (enemy.health <= 0) {
                enemies = enemies.filter(e => e !== enemy);
            }
        }
    });
}

function checkEnemyInRange(enemy) {
    // Check if the enemy is within the player's sight range
    // using handleCircleCollision
    const playerCircle = {
        xGU: player.sight.centerX(player.xGU),
        yGU: player.sight.centerY(player.yGU),
        widthGU: player.bullet.rangeGU * 2, // Use the bullet's range as the circle radius
        heightGU: player.bullet.rangeGU * 2, // Use the bullet's range as the circle radius
    };
    return handleCircleCollision(playerCircle, enemy);
}

// Function to update game state
function update(deltaTime) {
    player.move(deltaTime, keys);
    handlePlayerLookingDirection();

    enemies.forEach(enemy => {
        enemy.inRange = checkEnemyInRange(enemy);

        if (enemy.inRange) {
            const cx = player.sight.centerX(player.xGU);
            const cy = player.sight.centerY(player.yGU);
            const ex = enemy.xGU + enemy.widthGU / 2;
            const ey = enemy.yGU + enemy.heightGU / 2;

            const targetAngle = Math.atan2(ey - cy, ex - cx);

            // Angle difference in radians
            const angleDiff = Math.abs(((targetAngle - player.sight.lookingAngle + Math.PI) % (2 * Math.PI)) - Math.PI);

            // Only shoot if the player is roughly facing the enemy (within 5 degrees ~ 0.087 rad)
            if (angleDiff < 0.087) {
                player.shoot(bullets);
            }

            enemy.color = 'rgba(255, 0, 0, 1)';
        } else {
            enemy.color = target.color;
        }
    });

    updateBullets();
    EnemyContactDmg();
    moveEnemiesTowardsPlayer();

    if (player.health <= 0) {
        isPaused = true;
        pauseMenus.gameOver = !pauseMenus.gameOver;
    }

    player.xGU = Math.max(0, Math.min(gameWorld.widthGU - player.widthGU, player.xGU));
    player.yGU = Math.max(0, Math.min(gameWorld.heightGU - player.heightGU, player.yGU));
}


// Function to handle percentage to color hex code conversion
function percentageToColor(percentage) {
    const red = Math.floor((1 - percentage) * 255);
    const green = Math.floor(percentage * 255);
    const blue = 0; // Blue is not used in this case
    return [red, green, blue];
}
function rgbToHex(r, g, b) {
    // Ensure RGB values are within the range of 0-255
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    // Convert RGB to hex format
    // The formula converts RGB values to a single hex string
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Function to draw the game map
function drawMap() {
    ctx.fillStyle = gameWorld.color; // Set background color
    ctx.fillRect(0, 0, gameWorld.widthGU * GUtoPxX, gameWorld.heightGU * GUtoPxY); // Clear the canvas
    ctx.strokeStyle = gameWorld.borderColor; // Set border color
    // draw game map border
    ctx.strokeRect(0, 0, gameWorld.widthGU * GUtoPxX, gameWorld.heightGU * GUtoPxY); // Draw the border

    // draw game grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Light grid color
    ctx.lineWidth = 1; // Grid line thickness
    for (let i = 0; i <= gameGrid.rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * gameGrid.cellHeight);
        ctx.lineTo(gameWorld.widthGU * GUtoPxX, i * gameGrid.cellHeight);
        ctx.stroke();
        ctx.closePath();
    }
    for (let j = 0; j <= gameGrid.cols; j++) {
        ctx.beginPath();
        ctx.moveTo(j * gameGrid.cellWidth, 0);
        ctx.lineTo(j * gameGrid.cellWidth, gameWorld.heightGU * GUtoPxY);
        ctx.stroke();
        ctx.closePath();
    }

    // draw game quadrents
    // Make quadrents invisible when done testing
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'; // Quadrent border color
    ctx.lineWidth = 2; // Quadrent border thickness
    for (const [_, quadrent] of Object.entries(gameWorld.quadrents)) {
        ctx.strokeRect(
            quadrent.xGU * GUtoPxX,
            quadrent.yGU * GUtoPxY,
            quadrent.widthGU * GUtoPxX,
            quadrent.heightGU * GUtoPxY
        );
        if (!handlePlayerQuadrent(quadrent)) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'; // Quadrent fill color
        }
        else {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Quadrent fill color when player is in it
        }
        ctx.fillRect(
            quadrent.xGU * GUtoPxX,
            quadrent.yGU * GUtoPxY,
            quadrent.widthGU * GUtoPxX,
            quadrent.heightGU * GUtoPxY
        );
    }
}
function drawUI() {
    // draw sprint bar
    ctx.fillStyle = 'white';
    ctx.fillRect(10, 10, 200, 20); // Background bar
    ctx.fillStyle = rgbToHex(...percentageToColor(player.sprint.currentAmount / player.sprint.maxAmount));
    ctx.fillRect(10, 10, (player.sprint.currentAmount / player.sprint.maxAmount) * 200, 20); // Sprint bar
    ctx.fillStyle = 'black'; // Text color
    ctx.font = '16px Arial';
    ctx.fillText(`Sprint: ${Math.round(player.sprint.currentAmount)}`, 50, 25); // Display sprint amount

    // draw health bar
    ctx.fillStyle = 'white';
    ctx.fillRect(535, 10, 200, 20); // Background bar
    ctx.fillStyle = rgbToHex(...percentageToColor(player.health / player.maxHealth));
    ctx.fillRect(535, 10, (player.health / player.maxHealth) * 200, 20); // Health bar
    ctx.fillStyle = 'black'; // Text color
    ctx.font = '16px Arial';
    ctx.fillText(`Health: ${Math.round(player.health)}`, 575, 25); // Display health amount

    // draw aspects of screen
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    ctx.fillStyle = 'white'; // Text color
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${elapsedTime}s`, 20, 50); // Display elapsed time
    ctx.fillText(`Keys Pressed: ${Array.from(keys).join(', ')}`, 20, 70); // Display pressed keys
    ctx.fillText(`Player Position: (${Math.round(player.xGU)}, ${Math.round(player.yGU)})`, 20, 90); // Display player position
    ctx.fillText(`Player looking angle: ${Math.round(player.sight.lookingAngle * (180 / Math.PI))}°`, 20, 110); // Display player looking angle

    let speed = Math.sqrt(player.dxGU * player.dxGU + player.dyGU * player.dyGU).toFixed(3);
    ctx.fillText(`Player Current Speed: (${speed})`, 20, 130); // Display player speed
}

function drawPauseMenu() {
    ctx.fillStyle = 'rgba(7, 1, 62, 1)';
    ctx.fillRect(
        (gameWorld.widthGU * GUtoPxX / 2) * (3 / 5), // position
        (gameWorld.heightGU * GUtoPxY / 2) * (3 / 5),
        (gameWorld.widthGU * GUtoPxY / 10) * 4, // 2nd number is # of game tiles
        (gameWorld.heightGU * GUtoPxY / 10) * 4,
    );
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.strokeRect(
        (gameWorld.widthGU * GUtoPxX / 2) * (3 / 5), // position
        (gameWorld.heightGU * GUtoPxY / 2) * (3 / 5),
        (gameWorld.widthGU * GUtoPxY / 10) * 4, // 2nd number is # of game tiles
        (gameWorld.heightGU * GUtoPxY / 10) * 4,
    );

    // Text
    ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Text color
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Paused :)", gameWorld.widthGU * GUtoPxX / 2, gameWorld.heightGU * GUtoPxY / 2);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(175, 0, 0, 1)';
    ctx.fillRect(
        (gameWorld.widthGU * GUtoPxX / 2) * (3 / 5), // position
        (gameWorld.heightGU * GUtoPxY / 2) * (3 / 5),
        (gameWorld.widthGU * GUtoPxY / 10) * 4, // 2nd number is # of game tiles
        (gameWorld.heightGU * GUtoPxY / 10) * 4,
    );
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.strokeRect(
        (gameWorld.widthGU * GUtoPxX / 2) * (3 / 5), // position
        (gameWorld.heightGU * GUtoPxY / 2) * (3 / 5),
        (gameWorld.widthGU * GUtoPxY / 10) * 4, // 2nd number is # of game tiles
        (gameWorld.heightGU * GUtoPxY / 10) * 4,
    );

    // Text
    ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Text color
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("You Died :(", gameWorld.widthGU * GUtoPxX / 2, gameWorld.heightGU * GUtoPxY / 2);
}

// Function to draw the player
function drawPlayer() {
    // draw player looking direction
    ctx.beginPath();
    ctx.moveTo(
        player.sight.centerX(player.xGU) * GUtoPxX,
        player.sight.centerY(player.yGU) * GUtoPxY
    );
    // Draw a line in the direction the player is looking
    ctx.lineTo(
        (player.sight.centerX(player.xGU) + Math.cos(player.sight.lookingAngle) * player.bullet.rangeGU) * GUtoPxX,
        (player.sight.centerY(player.yGU) + Math.sin(player.sight.lookingAngle) * player.bullet.rangeGU) * GUtoPxY
    );
    ctx.strokeStyle = 'yellow'; // Line color
    ctx.lineWidth = 2; // Line thickness
    ctx.stroke();
    ctx.closePath();

    // Draw circlur range
    ctx.beginPath();
    ctx.arc(
        player.sight.centerX(player.xGU) * GUtoPxX,
        player.sight.centerY(player.yGU) * GUtoPxY,
        player.bullet.rangeGU * GUtoPxX, // Radius in pixels
        0,
        2 * Math.PI
    );
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Circle color with transparency
    ctx.lineWidth = 1; // Circle thickness
    ctx.stroke();
    ctx.closePath();

    // draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.xGU * GUtoPxX, player.yGU * GUtoPxY, player.widthGU * GUtoPxX, player.heightGU * GUtoPxY);
    ctx.strokeStyle = 'rgb(255, 255, 255)'; // Border color
    ctx.lineWidth = 2; // Border thickness
    ctx.strokeRect(player.xGU * GUtoPxX, player.yGU * GUtoPxY, player.widthGU * GUtoPxX, player.heightGU * GUtoPxY);

}
// Function to draw bullets
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.save(); // Save the current context

        // Move origin to bullet center
        ctx.translate(
            bullet.xGU * GUtoPxX + bullet.widthGU * GUtoPxX / 2,
            bullet.yGU * GUtoPxY + bullet.heightGU * GUtoPxY / 2
        );

        // Rotate context to bullet angle
        ctx.rotate(bullet.aspects.angleShot);

        // Draw rotated bullet
        ctx.fillStyle = bullet.ColorManagement;
        ctx.fillRect(
            -bullet.widthGU * GUtoPxX / 2,
            -bullet.heightGU * GUtoPxY / 2,
            bullet.widthGU * GUtoPxX,
            bullet.heightGU * GUtoPxY
        );
        // Draw border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            -bullet.widthGU * GUtoPxX / 2,
            -bullet.heightGU * GUtoPxY / 2,
            bullet.widthGU * GUtoPxX,
            bullet.heightGU * GUtoPxY
        );
        ctx.restore(); // Restore to original state
    });
}

// Function to draw enemies
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color; // Use the color property set in update()
        ctx.fillRect(enemy.xGU * GUtoPxX, enemy.yGU * GUtoPxY, enemy.widthGU * GUtoPxX, enemy.heightGU * GUtoPxY); // Draw enemy rectangle
        ctx.strokeStyle = 'black'; // Border color
        ctx.lineWidth = 1; // Border thickness
        ctx.strokeRect(enemy.xGU * GUtoPxX, enemy.yGU * GUtoPxY, enemy.widthGU * GUtoPxX, enemy.heightGU * GUtoPxY); // Draw enemy border
    });
}

// Function to draw the game objects
function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw the game map
    drawMap();

    // Draw the player
    player.draw(ctx);
    // draw bullets
    drawBullets();

    // Draw enemies
    drawEnemies();

    // Draw the UI
    drawUI();
}

// Game loop    
function gameLoop(currentTime) {
    // Calculate delta time in seconds
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (!isPaused) {
        update(deltaTime);
        draw();
    }
    if (isPaused && pauseMenus.normalPause)
        drawPauseMenu();
    else if (isPaused && pauseMenus.gameOver)
        drawGameOver();

    requestAnimationFrame(gameLoop);
}

// Start enemy spawning
// NOTE: Call spawnEnemies() only ONCE to avoid multiple intervals and excessive enemy spawns.
spawnEnemies();
// Start game loop
gameLoop(lastTime);
