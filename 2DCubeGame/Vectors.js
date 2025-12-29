// this script will handle 2d movement logic for moving anything

export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) { return new Vector2(this.x + v.x, this.y + v.y); } // return sum of two vectors as new Vector2
    subtract(v) { return new Vector2(this.x - v.x, this.y - v.y); } // return difference of two vectors as new Vector2
    multiply(scalar) { return new Vector2(this.x * scalar, this.y * scalar); } // scalar multiplication returns new Vector2
    divide(scalar) { return new Vector2(this.x / scalar, this.y / scalar); } // scalar division returns new Vector2

    length() { return Math.hypot(this.x, this.y); } // magnitude of vector returns number
    normalize() { return this.length() === 0 ? new Vector2(0, 0) : this.divide(this.length()); } // return unit vector as new Vector2
    clone() { return new Vector2(this.x, this.y); } // return copy of vector as new Vector2
    set(x, y) { this.x = x; this.y = y; return this; } // set vector components returns this

    dot(v) { return this.x * v.x + this.y * v.y; } // dot product returns number
    angle() { return Math.atan2(this.y, this.x); } // angle of vector in radians returns number
    distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y); } // distance to another vector returns number
    limit(max) { return this.length() > max ? this.normalize().multiply(max) : this; } // limit vector length returns new Vector2
    rotate(angle) {
        const cos = Math.cos(angle); // acts as 'x' scale
        const sin = Math.sin(angle); // acts as 'y' skew
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    // Smooth movement towards a target vector
    // tagert: Vector2 - the target vector to lerp towards
    // time: number between 0 and 1 representing interpolation factor
    lerp(target, time) {
        return new Vector2(
            this.x + (target.x - this.x) * time,
            this.y + (target.y - this.y) * time
        );
    }

    equals(v, tolerance = 0.0001) {
        return Math.abs(this.x - v.x) < tolerance &&
               Math.abs(this.y - v.y) < tolerance;
    }

    perpendicular() {
        return new Vector2(-this.y, this.x);
    }

}