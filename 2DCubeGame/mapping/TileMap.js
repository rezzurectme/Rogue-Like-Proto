import { Tile, mapData } from './map.js';
import { Vector2 } from "./Vectors.js";

export class TileMap {
    constructor() {
        this.tiles = mapData;
    }

    // function to change # data -> tile type String
    numToType(num) {
        switch (num) {
            case 0:
                return "floor"
            case 1:
                return "wall"
            case 2:
                return "water"
            default:
                break;
        }
    }

    render(ctx) {
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {

                const tile = new Tile(new Vector2(x * 50, y * 50), 50, 50, this.numToType(this.tiles[y][x]))
                const img = tile.tileImages[tile.type];

                if (img.complete) {
                    ctx.drawImage(img,
                        x * tile.size,
                        y * tile.size,
                        tile.size,
                        tile.size
                    );
                } else {
                    ctx.fillStyle = "magenta";
                    ctx.fillRect(x * tile.size, y * tile.size, tile.size, tile.size);

                }

                /*
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
                */
            }
        }
    }

    getTileAt(x, y) {
        const col = Math.floor(x / 50);
        const row = Math.floor(y / 50);

        if (col < 0 || col >= this.tiles[0].length) return 1;
        if (row < 0 || row >= this.tiles.length) return 1;

        return this.tiles[row][col];
    }
}