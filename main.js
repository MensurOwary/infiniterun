const HEIGHT = 500;
const WIDTH = 1000;

const canvas = document.getElementById("game");
canvas.width = WIDTH;
canvas.height = HEIGHT;

const ctx = canvas.getContext("2d");

function clamp(number, min, max) {
    if (number >= max) return max;
    else if (number <= min) return min;
    return number;
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.height = 70;
        this.width = 70;
    }

    draw() {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= 10;
        this.y = clamp(this.y, 0, 450 - this.height);
    }

    bounds() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }
}

class Rectangle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    intersects(other) {
        const r1 = this;
        const r2 = other;

        return (
            r1.x < r2.x + r2.width &&
            r1.x + r1.width > r2.x &&
            r1.y < r2.y + r2.height &&
            r1.height + r1.y > r2.y
        );
    }
}

class HUD {
    constructor() {
        this.x = 100;
        this.y = 50;
        this.score = 0;
    }

    draw() {
        ctx.fillStyle = "black";
        ctx.font = "2.5rem serif";
        ctx.textAlign = "center";
        ctx.fillText(`Score: ${this.score}`, this.x, this.y);
    }

    update() {}

    addScore() {
        this.score += 1;
    }
}

class Cloud {

    constructor() {
        this.x = 1500;
        this.y = Math.random() > 0.5 ? 100 : 200;
        
        this.img = new Image();
        this.img.src = './assets/cloud_1.png';
    }

    draw() {
        ctx.drawImage(
            this.img,
            this.x,
            this.y,
            200,
            90
        );
    }

    bounds() {
        return new Rectangle(0, 0, WIDTH, HEIGHT);
    }

    update() {
        this.x -= 5;
    }

}

class Background {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    draw() {
        ctx.fillStyle = "lightblue";
        ctx.fillRect(this.x, this.y, WIDTH, HEIGHT);
    }

    bounds() {
        return new Rectangle(0, 0, WIDTH, HEIGHT);
    }

    update() {}
}

class Platform {
    constructor() {
        this.x = 0;
        this.y = 450;
    }

    draw() {
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y, WIDTH, 50);
    }

    bounds() {
        return new Rectangle(0, 450, WIDTH, 50);
    }

    update() {}
}

class Player {
    constructor(game) {
        this.width = 100;
        this.height = 100;
        this.x = 50;
        this.y = 450 - 100;
        this.game = game;

        this.isJumping = false;

        this.INITIAL_VELOCITY = 12;
        this.MAX_GRAVITY = 0.5;

        this.vel = this.INITIAL_VELOCITY;
        this.g = this.MAX_GRAVITY;

        this.assets = [
            "./assets/run_1.png",
            "./assets/run_2.png",
            "./assets/run_3.png",
            "./assets/run_4.png",
            "./assets/run_5.png",
            "./assets/run_6.png",
            "./assets/run_7.png",
            "./assets/run_8.png",
            "./assets/run_9.png",
            "./assets/run_10.png",
        ];

        this.images = this.assets.map((url) => {
            const img = new Image();
            img.src = url;
            return img;
        });

        this.currentImage = 0;
    }

    draw() {
        ctx.fillStyle = "darkblue";
        ctx.drawImage(
            this.images[this.currentImage],
            this.x,
            this.y + 8,
            this.width,
            this.height
        );
    }

    moveY() {
        this.isJumping = true;
    }

    update() {
        const collided = this.getCollidedObjects();
        if (collided.length > 0) {
            this.game.stop = true;
        }

        if (this.isJumping) {
            this.vel = this.vel - this.g;
            this.y -= this.vel;
            this.y = clamp(this.y, 0, 450 - this.height);
            if (this.y === 450 - this.height) {
                this.isJumping = false;
            }
        } else {
            this.vel = this.INITIAL_VELOCITY;
            this.g = this.MAX_GRAVITY;
        }

        this.currentImage++;
        this.currentImage = this.currentImage % this.images.length;
    }

    getCollidedObjects() {
        const collided = this.game.elements
            .filter((e) => e instanceof Enemy)
            .filter((e) => e.bounds().intersects(this.bounds()));

        return collided;
    }

    bounds() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }
}

class Game {

    init() {
        this.player = new Player(this);
        this.bg = new Background();
        this.platform = new Platform();
        this.hud = new HUD();
        this.stop = true;
        this.started = false;

        this.enemies = [new Enemy(1500, 600)];

        this.elements = [
            this.bg,
            new Cloud(),
            this.platform,
            this.player,
            ...this.enemies,
            this.hud,
        ];

        this.loops = 0;
        this.tick_rate = 60;
        this.skip_ticks = 1000 / this.tick_rate;
        this.maxFrameSkip = 10;
        this.nextTick = performance.now();
    }

    constructor() {
        this.init();
    }

    registerKeyBindings() {
        const keyDown = (event) => {
            if (event.defaultPrevented) return;
            if (event.code === "ArrowUp") {
                this.player.moveY(false);
            } else if (event.code === "Space") {
                if (this.stop) {
                    this.init()
                }
            } else if (event.code === "Escape") {
                this.started = true;
                this.stop = !this.stop;
            }
            event.preventDefault();
        };
        window.addEventListener("keydown", keyDown.bind(this), true);
    }

    draw() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        
        for (let el of this.elements) {
            el.draw();
        }

        if (this.started) {
            if (this.stop) {
                ctx.fillStyle = "black";
                ctx.font = "2.5rem serif";
                ctx.fillText(`game over!`, 150, 150);
                ctx.font = "1.5rem serif";
                ctx.fillText(`press <space> to restart`, 150, 200);
            }
        } else {
            ctx.fillStyle = "black";
            ctx.font = "2.5rem serif";
            ctx.fillText(`ArrowUp to jump`, 150, 150);
            ctx.fillText(`Esc to start/pause`, 150, 200);
        }
    }

    update() {
        if (!this.stop) {
            this.elements.forEach((e) => e.update());

            this.elements = this.elements.filter((e) => {
                return e.x >= -1000;
            });

            if (this.elements.some((a) => a instanceof Enemy) === false) {
                this.elements.push(new Enemy(1400, 600));
                this.hud.addScore();
            }

            if (this.elements.some((a) => a instanceof Cloud) === false) {
                this.elements.push(new Cloud());
            }
        }
    }

    gameLoop(now) {
        this.loops = 0;

        while (
            now > this.nextTick &&
            this.loops < this.maxFrameSkip
        ) {
            this.update();
            this.nextTick += this.skip_ticks;
            this.loops++;
        }

        this.draw();
        window.requestAnimationFrame(this.gameLoop.bind(this));
    }

    start() {
        this.registerKeyBindings();
        window.requestAnimationFrame(this.gameLoop.bind(this));
    }
}

const game = new Game();
game.start();
