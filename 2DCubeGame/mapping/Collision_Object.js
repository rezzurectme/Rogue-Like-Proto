// Parent Script for any Collision Object
// used to define common properties and methods for collision objects
import { Vector2 } from "../Vectors.js";

export class CollisionObject {
    constructor(position = new Vector2(0, 0), width = 50, height = 50, radius = null, type = "rectangle") {
        this.position = position; // position of the object
        this.width = width;       // width of the object
        this.height = height;     // height of the object
        this.radius = radius;     // radius of the object (if it's a circle)
        this.type = type;         // type of the collision object
        this.doCollision = true; // flag to enable/disable collision
    }
    // method to get the bounding box of the object
    getBoundingBox() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height
        };
    }
    
    // method to check collision with another CollisionObject
    isCollidingWith(other) {
        if (this.doCollision === false || other.doCollision === false) return false;
        if (this.type === "rectangle" && other.type === "rectangle") {
            // AABB collision detection
            return !(
                this.position.x + this.width < other.position.x ||
                this.position.x > other.position.x + other.width ||
                this.position.y + this.height < other.position.y ||
                this.position.y > other.position.y + other.height
            );
        }
        else if (this.type === "circle" && other.type === "circle") {
            // Circle collision detection
            const distX = this.position.x - other.position.x;
            const distY = this.position.y - other.position.y;
            const distance = Math.hypot(distX, distY);
            return distance < (this.radius + other.radius);
        }
        else if (this.type === "rectangle" && other.type === "circle") {
            // Rectangle-circle collision detection
            const circleDistX = Math.abs(other.position.x - (this.position.x + this.width / 2));
            const circleDistY = Math.abs(other.position.y - (this.position.y + this.height / 2));
            if (circleDistX > (this.width / 2 + other.radius)) { return false; }
            if (circleDistY > (this.height / 2 + other.radius)) { return false; }
            if (circleDistX <= (this.width / 2)) { return true; }
            if (circleDistY <= (this.height / 2)) { return true; }
            const cornerDistanceSq = Math.pow(circleDistX - this.width / 2, 2) + Math.pow(circleDistY - this.height / 2, 2);
            return cornerDistanceSq <= Math.pow(other.radius, 2);
        }
        else if (this.type === "circle" && other.type === "rectangle") {
            // Circle-rectangle collision detection (reverse)
            return other.isCollidingWith(this);
        }
        return false; // default no collision
    }

    // method to correct position after collision (simple resolution)
    resolveCollision(other) {
        // Simple resolution: move this object out of collision along the smallest axis
        if (!this.doCollision || !other.doCollision || !this.isCollidingWith(other)) return;
        const overlapX = (this.position.x + this.width) - other.position.x;
        const overlapY = (this.position.y + this.height) - other.position.y;
        if (Math.abs(overlapX) < Math.abs(overlapY)) {
            // resolve in x direction
            if (this.position.x < other.position.x) {
                this.position.x -= overlapX;
            } else {
                this.position.x += overlapX;
            }
        }
        else {
            // resolve in y direction
            if (this.position.y < other.position.y) {
                this.position.y -= overlapY;
            } else {
                this.position.y += overlapY;
            }
        }
    }

    // method to render the collision object (for debugging)
    render(ctx) {
        ctx.save();
        ctx.strokeStyle = this.type === "rectangle" ? "red" : "blue";
        ctx.lineWidth = 2;
        if (this.type === "rectangle") {
            ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
        }
        else if (this.type === "circle") {
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

}