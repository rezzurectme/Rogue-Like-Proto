import { tileSize, mapData } from './map.js';

export class TileMap {
    constructor() {
        this.tiles = mapData;
        this.tileWidth = tileSize;
        this.tileHeight = tileSize;


        // load a dictionary of tile images
        this.tileImages = {
            0: this.loadImage('./assets/tiles/floor.png'), // floor
            1: this.loadImage('./assets/tiles/wall.png'),  // wall
            2: this.loadImage('./assets/tiles/water.png')  // water
        };
    }

    loadImage(src) {
        const img = new Image(this.tileWidth, this.tileHeight); // set a default size for the images
        img.src = src;
        return img;
    }

    render(ctx) {
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {

                const tile = this.tiles[y][x];
                const img = this.tileImages[tile];

                if (img.complete) {
                    ctx.drawImage(img,
                        x * tileSize,
                        y * tileSize,
                        tileSize,
                        tileSize
                    );
                } else {
                    // fallback placeholder if image not loaded yet
                    ctx.fillStyle = "magenta";
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }
    }

    getTileAt(x, y) {
        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize);

        if (col < 0 || col >= this.tiles.length) return 1; // out of bounds, treat as wall
        if (row < 0 || row >= this.tiles[0].length) return 1; // out of bounds, treat as wall

        return this.tiles[row][col];
    }
}