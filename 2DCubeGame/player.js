import { Vector2 } from "./Vectors.js";
import { isKeyPressed } from "./inputs.js";
import { CollisionObject } from "./mapping/Collision_Object.js";

export class Player extends CollisionObject {
    constructor(position = new Vector2(0, 0), speed = 200) {
        // Call parent constructor
        super(position, 20, 20, null, "rectangle");

        // ---- Player-specific properties ----
        this.velocity = new Vector2(0, 0);
        this.speed = speed;
        this.direction = new Vector2(1, 0);

        // ---- Dash Properties ----
        this.isDashing = false;
        this.dashDistance = 150;
        this.dashCooldown = 2.0;
        this.dashCooldownTimer = 0;
        this.dashTime = 0.2;
    }
    
    update(dt) {
        this.normalMovement(dt);
        this.updateDirection();
        //this.dash(dt);
    }

    normalMovement(dt) {
        // create a direction vector based on key inputs
        let dir = new Vector2();

        if (isKeyPressed("w"))  dir.y -= 1;
        if (isKeyPressed("s"))  dir.y += 1;
        if (isKeyPressed("a"))  dir.x -= 1;
        if (isKeyPressed("d"))  dir.x += 1;

        dir = dir.normalize();

        const sprint = isKeyPressed("shift") ? 2 : 1;

        // desired player velocity
        this.velocity = dir.multiply(this.speed * sprint);

        // update player position
        this.position = this.position.add(this.velocity.multiply(dt));
    }

    dash(dt) {
        // steps for dash logic to be implemented
        // 1. Check if dash key is pressed & cooldown is 0 or less & not already dashing
        if (isKeyPressed(" ") && this.dashCooldownTimer <= 0 && !this.isDashing) {
            // 1.5. if all conditions met, set isDashing to true, set dash target position based on current direction & dashDistance
            this.isDashing = true;
            // set dash target position based on current direction & dashDistance
            this.dashTarget = this.position.add(this.direction.normalize().multiply(this.dashDistance));
            this.dashTimer = 0;
        }
        // 2. if dashing, lerp player position towards dash target over dashTime
        if (this.isDashing) {
            this.dashTimer += dt;
            const t = Math.min(this.dashTimer / this.dashTime, 1);
            this.position = this.position.lerp(this.dashTarget, t);
            if (t >= 1) {
                this.isDashing = false;
                this.dashCooldownTimer = this.dashCooldown;
            }
        }
        // 3. after dashTime is over, set isDashing to false and start cooldown timer with dashCooldown value & dt
        if (this.dashCooldownTimer > 0) {
            // 4. decrement cooldown timer by dt until it reaches 0
            this.dashCooldownTimer -= dt;
            if (this.dashCooldownTimer < 0) this.dashCooldownTimer = 0;
        }

    }

    updateDirection() {
        if (this.velocity.length() > 0) {
            this.direction = this.velocity.normalize();
        }
    }

    draw(ctx) {
        ctx.fillStyle = "green";
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    drawVelocityV(ctx) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(this.position.x + 10, this.position.y + 10);
        ctx.lineTo(
            this.position.x + 10 + this.velocity.x * 0.1,
            this.position.y + 10 + this.velocity.y * 0.1
        );
        ctx.stroke();
    }

    drawDirectionV(ctx) {
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(this.position.x + 10, this.position.y + 10);
        ctx.lineTo(
            this.position.x + 10 + this.direction.x * 20,
            this.position.y + 10 + this.direction.y * 20
        );
        ctx.stroke();
    }

}