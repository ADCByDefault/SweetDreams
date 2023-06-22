/**
 * @type {HTMLCanvasElement};
 */
const canvas = document.getElementById("canvas");
/**
 * @type {CanvasRenderingContext2D};
 */
const ctx = canvas.getContext("2d");
ctx.properties = {
    fillStyle: "white",
    strokeStyle: "white",
    lineWidth: 1,
    lineCap: "round",
    baseOffsetX: 20,
    baseOffsetY: 20,
    centerPiece: 5,
    pointSize: 2,
};
window.addEventListener("load", () => {
    resizeCanvas();
    setUpCTX(ctx);
    set();
});
window.addEventListener("resize", () => {
    resizeCanvas();
});
window.addEventListener("click", (e) => {
    console.log(e.clientX, e.clientY);
    set();
});

function resizeCanvas() {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}

class Point {
    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(x, y, ctx) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
    }
    getPoint() {
        return [this.x, this.y];
    }
    setPoint(x, y) {
        this.x = x;
        this.y = y;
    }
    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, ctx.properties.pointSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.closePath();
    }
}
class Arc {
    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {Point} point
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} color
     */
    constructor(x, y, radius, point, velocity, startingAngle, ctx, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.point = point;
        this.velocity = velocity;
        this.angle = startingAngle;
        this.ctx = ctx;
        this.color = color;
    }
    draw() {
        this.ctx.save();
        this.ctx.fillStyele = this.color;
        this.ctx.strokeStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, Math.PI, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
        this.point.draw();
        this.ctx.restore();
    }
    movePoint() {
        this.angle += -this.velocity;
        if (this.angle < 0) {
            this.angle = Math.PI * 2;
        }
        let x = Math.cos(this.angle) * this.radius;
        let y = Math.sin(this.angle) * this.radius;
        if (this.angle < Math.PI) {
            this.point.setPoint(this.x + x, this.y - y);
        } else {
            this.point.setPoint(this.x + x, this.y + y);
        }
    }
}
const herphone = {
    arcs: 5,
    velocity: 0.02,
    decrease: 0.001,
    startingAngle: Math.PI,
};
const arcs = [];
/**
 *
 * @param {number} n
 * @param {number} lineFrom
 * @param {number} lineTo
 * @param {number} x
 * @param {number} y
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} color
 */
function createArcs(n, lineFrom, lineTo, x, y, ctx, color) {
    const length = lineTo - lineFrom;
    for (let i = 1; i <= n; i++) {
        let radius = (length / n) * i;
        let point = new Point(x - radius, y, ctx);
        let arc = new Arc(
            x,
            y,
            radius,
            point,
            herphone.velocity - herphone.decrease * i,
            herphone.startingAngle,
            ctx,
            color
        );
        arcs.push(arc);
    }
}
function set() {
    drawBase(ctx, canvas);
    createArcs(
        herphone.arcs,
        ctx.properties.baseOffsetX,
        canvas.width / 2 - ctx.properties.centerPiece,
        canvas.width / 2,
        canvas.height - ctx.properties.baseOffsetY,
        ctx,
        "white"
    );
}
/**
 *
 * @param {CanvasRenderingContext2D} ctx
 */
function setUpCTX(ctx) {
    ctx.fillStyle = ctx.properties.fillStyle;
    ctx.strokeStyle = ctx.properties.strokeStyle;
    ctx.lineWidth = ctx.properties.lineWidth;
    ctx.lineCap = ctx.properties.lineCap;
}
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 */
function drawBase(ctx, canvas) {
    let width = canvas.width;
    let height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(ctx.properties.baseOffsetX, height - ctx.properties.baseOffsetY);
    ctx.lineTo(
        width - ctx.properties.baseOffsetX,
        height - ctx.properties.baseOffsetY
    );
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(
        width / 2,
        height - ctx.properties.baseOffsetY,
        ctx.properties.centerPiece,
        Math.PI,
        Math.PI * 2
    );
    ctx.fill();
    ctx.closePath();
}
function animation() {
    window.requestAnimationFrame(animation);
    drawBase(ctx, canvas);
    arcs.forEach((arc) => {
        arc.draw();
        arc.movePoint();
    });
}
animation();
