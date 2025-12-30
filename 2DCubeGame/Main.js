import { Vector2 } from './Vectors.js';
import { Player } from './player.js';
import { TileMap } from './mapping/TileMap.js';

export const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 12*50;
canvas.height = 12*50;

const tileMap = new TileMap();

const devMode = true;

const player = new Player(new Vector2(canvas.width / 2, canvas.height / 2), 200);

function update(dt) {
    player.update(dt);

    // clamp player position to canvas bounds
    player.position.x = Math.max(0, Math.min(player.position.x, canvas.width - 20));
    player.position.y = Math.max(0, Math.min(player.position.y, canvas.height - 20));
}

let last = 0;

function updateUI(player) {
    document.getElementById("pos").textContent =
        `Position: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)})`;

    document.getElementById("speed").textContent =
        `Speed: ${player.velocity.length().toFixed(1)}`;

    document.getElementById("cooldown").textContent =
        `Dash Cooldown: ${player.dashCooldownTimer.toFixed(2)}`;
}

function gameLoop(t) {
    const dt = (t - last) / 1000;
    last = t;

    update(dt); 
    player.updateDirection();

    // update UI
    updateUI(player);

    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw tile map
    tileMap.render(ctx);

    // draw player
    player.draw(ctx);

    if (devMode) {
        // render vector of player velocity
        player.drawVelocityV(ctx);

        // render vector of player direction
        player.drawDirectionV(ctx);

        //Draw dash target point
        if (player.isDashing) {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(player.dashTarget.x + 10, player.dashTarget.y + 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

}
