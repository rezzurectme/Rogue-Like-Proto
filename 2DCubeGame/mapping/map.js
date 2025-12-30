import { CollisionObject } from "./Collision_Object";
import { Vector2 } from "./Vectors.js";

export class Tile extends CollisionObject {
    constructor(position = new Vector2(0, 0), width = 50, height = 50, type = 'floor') {
        super(position, width, height, null, "rectangle");
        this.type = type;
        this.size = 50;

        this.tileImages = {
            "floor": this.loadImage('./assets/tiles/floor.png'),    // floor
            "wall": this.loadImage('./assets/tiles/wall.png'),      // wall
            "water": this.loadImage('./assets/tiles/water.png')     // water
        };
    }

    loadImage(src) {
        const img = new Image(this.size, this.size); // set a default size for the images
        img.src = src;
        return img;
    }
}

export const mapData = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];