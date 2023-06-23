/**
 * @type {HTMLCanvasElement};
 */
const canvas = document.getElementById("canvas");
/**
 * @type {CanvasRenderingContext2D};
 */
const ctx = canvas.getContext("2d");
/**
 * @type {AudioContext};
 */
const audioCtx = new AudioContext();
const gain = audioCtx.createGain();
gain.connect(audioCtx.destination);
ctx.properties = {
    fillStyle: "white",
    strokeStyle: "white",
    lineWidth: 1,
    lineCap: "round",
    baseOffsetX: 20,
    baseOffsetY: 20,
    centerPiece: 5,
    pointSize: 3,
};
window.addEventListener("load", () => {
    resizeCanvas();
    setUpCTX(ctx);
});
window.addEventListener("resize", () => {
    resizeCanvas();
});
window.addEventListener("click", (e) => {
    console.log(e.clientX, e.clientY);
    audioCtx.resume();
    setUpCTX(ctx);
    set();
});

function resizeCanvas() {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}
const herphone = {
    arcs: 10,
    baseFrequency: 200,
    FrequencyStep: 20,
    time: 100,
    roundOfFirst: 10,
    startingAngle: Math.PI,
    killTime: 1,
    gainTime: 0.01,
};
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
    delete() {
        this.x = null;
        this.y = null;
        this.ctx = null;
    }
}
class Sound {
    /**
     * @type {AudioContext}
     */
    static audioCtx = audioCtx;
    /**
     * @type {GainNode}
     */
    static gain = gain;
    static gainTime = herphone.gainTime;
    static killTime = herphone.killTime;
    /**
     *
     * @param {number} frequency
     */
    constructor(frequency) {
        /**
         * @type {GainNode}
         */
        this.gain1 = Sound.audioCtx.createGain();
        this.gain1.connect(Sound.gain);
        this.oscillator = Sound.audioCtx.createOscillator();
        this.oscillator.frequency.value = frequency;
        this.oscillator.connect(this.gain1);
        this.gain1.gain.value = 0;
        this.oscillator.start();
    }
    play() {
        this.gain1.gain.linearRampToValueAtTime(
            0.3,
            Sound.audioCtx.currentTime + Sound.gainTime
        );
    }
    stop() {
        this.gain1.gain.linearRampToValueAtTime(
            0,
            Sound.audioCtx.currentTime + Sound.killTime
        );
    }
    delete() {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.gain1.disconnect();
        this.oscillator = null;
        this.gain1 = null;
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
    constructor(
        x,
        y,
        radius,
        point,
        velocity,
        startingAngle,
        ctx,
        color,
        frequency
    ) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.point = point;
        this.velocity = velocity;
        this.angle = startingAngle;
        this.ctx = ctx;
        this.color = color;
        this.sound = new Sound(frequency);
        this.interval = setInterval(() => {
            this.playSound();
        }, ((1 / (this.velocity / frameFrequency)) * 1000) / 2);
    }
    playSound() {
        this.sound.play();
        this.sound.stop();
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
            this.angle += Math.PI * 2;
        }
        let x = Math.cos(this.angle) * this.radius;
        let y = Math.sin(this.angle) * this.radius;
        if (this.angle < Math.PI) {
            this.point.setPoint(this.x + x, this.y - y);
        } else {
            this.point.setPoint(this.x + x, this.y + y);
        }
    }
    delete() {
        this.x = null;
        this.y = null;
        this.radius = null;
        this.point.delete();
        this.point = null;
        this.velocity = null;
        this.angle = null;
        this.ctx = null;
        this.color = null;
        this.sound.delete();
        this.sound = null;
        clearInterval(this.interval);
    }
}

const frameFrequency = (Math.PI * 2) / 60;
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
    let j = arcs.length;
    for (let i = j - 1; i >= 0; i--) {
        arcs[i].delete();
        arcs.pop();
    }
    for (let i = 1; i <= n; i++) {
        let radius = (length / n) * i;
        let point = new Point(x - radius, y, ctx);
        let velocity =
            (herphone.roundOfFirst - i + 1 + herphone.arcs) / herphone.time;
        velocity = velocity * frameFrequency;
        let arc = new Arc(
            x,
            y,
            radius,
            point,
            velocity,
            herphone.startingAngle,
            ctx,
            color,
            herphone.baseFrequency + herphone.FrequencyStep * i
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
    if (canvas.width > 1000) {
        width = 980;
        ctx.properties.baseOffsetX = (canvas.width - 1000) / 2;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(
        ctx.properties.baseOffsetX,
        canvas.height - ctx.properties.baseOffsetY
    );
    ctx.lineTo(
        canvas.width - ctx.properties.baseOffsetX,
        canvas.height - ctx.properties.baseOffsetY
    );
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(
        canvas.width / 2,
        canvas.height - ctx.properties.baseOffsetY,
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
