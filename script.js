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
    window.location.reload();
});
function resizeCanvas() {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}
/**
 * @type {HTMLElement}
 */
const playButton = document.querySelector("#status");
let animationRequest = null;

playButton.addEventListener("click", () => {
    const status = playButton.getAttribute("status");
    playButton.classList.toggle("play");
    playButton.classList.toggle("pause");
    if (status === "pause") {
        playButton.setAttribute("status", "play");
        audioCtx.resume();
        set();
        animation();
    } else {
        playButton.setAttribute("status", "pause");
        audioCtx.suspend();
        window.cancelAnimationFrame(animationRequest);
    }
});

/**
 * collection of the properties of the arcs that can be changed by user
 */
const herphone = {
    arcs: 10,
    baseFrequency: 200,
    FrequencyStep: 20,
    time: 100,
    roundOfFirst: 10,
    startingAngle: Math.PI,
    killTime: 1,
    gainTime: 0.01,
    waveType: "sine",
    color: {
        from: "777777",
        to: "ffffff",
    },
};
class Point {
    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {CanvasRenderingContext2D} ctx (the canvas context)
     * and should have a property called porperties
     * this property should have the following property:
     * pointSize: number
     * {ctx.properties.pointSize}
     * @param {string} color (all the accepted by ctx)
     * creates a vector with the given x and y
     */
    constructor(x, y, ctx, color) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.color = color;
    }
    /**
     *
     * @returns {number[]} returns the point vector as an array
     */
    getPoint() {
        return [this.x, this.y];
    }
    /**
     *
     * @param {number} x
     * @param {number} y
     * sets the vector values to the given x and y
     */
    setPoint(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * draws the point on the canvas
     * size is ctx.properties.pointSize
     */
    draw() {
        this.ctx.save();
        this.ctx.fillStyle = this.color;
        this.ctx.strokeStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, ctx.properties.pointSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.restore();
    }
    /**
     * sets all the values to null
     */
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
    /**
     * @type {number} time to go from 0A to maxA
     */
    static gainTime = herphone.gainTime;
    /**
     * @type {number} time to go from maxA to 0A
     */
    static killTime = herphone.killTime;
    /**
     * @type {string} wave type
     */
    static waveType = herphone.waveType;
    /**
     *
     * @param {number} frequency
     * creates a sound with the given frequency
     */
    constructor(frequency) {
        /**
         * @type {GainNode}
         */
        this.gain1 = Sound.audioCtx.createGain();
        this.gain1.connect(Sound.gain);
        this.oscillator = Sound.audioCtx.createOscillator();
        this.oscillator.frequency.value = frequency;
        this.oscillator.type = Sound.waveType;
        this.oscillator.connect(this.gain1);
        this.gain1.gain.value = 0;
        this.oscillator.start();
    }
    /**
     * plays the sound from 0A to 0.3A in Sound.gainTime seconds
     */
    play() {
        this.gain1.gain.linearRampToValueAtTime(
            0.3,
            Sound.audioCtx.currentTime + Sound.gainTime
        );
    }
    /**
     * stops the sound from 0.3A to 0A in Sound.killTime seconds
     */
    stop() {
        this.gain1.gain.linearRampToValueAtTime(
            0,
            Sound.audioCtx.currentTime + Sound.killTime
        );
    }
    /**
     * sets all the values to null and disconnects the oscillator
     */
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
     * @param {number} velocity
     * @param {number} startingAngle
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} color
     * @param {number} frequency
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
        this.frequency = frequency;
        this.sound = new Sound(frequency);
        this.interval = setInterval(() => {
            this.playSound();
        }, ((1 / (this.velocity / frameFrequency)) * 1000) / 2);
    }
    /**
     * plays the arc sound and stops it (gainTime and killTime, see Sound class)
     */
    playSound() {
        this.sound.play();
        this.sound.stop();
    }
    /**
     * draws the arc and the point
     */
    draw() {
        this.ctx.save();
        this.ctx.fillStyele = this.color;
        this.ctx.strokeStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, Math.PI, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
        ctx.strokeText(this.frequency, this.x - this.radius, this.y + 10);
        this.point.draw();
        this.ctx.restore();
    }
    /**
     * moves the point on the arc by one step (velocity)
     */
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
    /**
     * sets all the values to null
     */
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
 * @param {number} n number of arcs
 * @param {number} lineFrom starting x of the base line
 * @param {number} lineTo ending x of the base line
 * @param {number} x center x of all arcs
 * @param {number} y center y of all arcs
 * @param {CanvasRenderingContext2D} ctx canvas context
 * @param {string} color from and to color of the arcs
 * color is a hex string without the #
 * color{
 *  from: string,
 *  to: string
 * }
 *
 */
function createArcs(n, lineFrom, lineTo, x, y, ctx, color) {
    const length = lineTo - lineFrom;
    if (arcs == null) {
        const arcs = [];
    }
    let j = arcs.length;
    for (let i = j - 1; i >= 0; i--) {
        arcs[i].delete();
        arcs.pop();
    }
    for (let i = 1; i <= n; i++) {
        let radius = (length / n) * i;
        let colorHex = parseInt(
            (
                parseInt(color.from, 16) +
                ((parseInt(color.to, 16) - parseInt(color.from, 16)) /
                    herphone.arcs) *
                    i
            ).toFixed(0)
        ).toString(16);
        let point = new Point(x - radius, y, ctx, `#${colorHex}`);
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
            `#${colorHex}`,
            herphone.baseFrequency + herphone.FrequencyStep * i
        );
        arcs.push(arc);
    }
}
function set() {
    drawBase(ctx, canvas);
    if (!isReset()) {
        console.log("reset no");
        return;
    }
    createArcs(
        herphone.arcs,
        ctx.properties.baseOffsetX,
        canvas.width / 2 - ctx.properties.centerPiece,
        canvas.width / 2,
        canvas.height - ctx.properties.baseOffsetY,
        ctx,
        herphone.color
    );
    console.table(arcs);
}
/**
 *
 * @param {CanvasRenderingContext2D} ctx canvas context
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
    animationRequest = window.requestAnimationFrame(animation);
    drawBase(ctx, canvas);
    arcs.forEach((arc) => {
        arc.draw();
        arc.movePoint();
    });
}
let first = true;
function isReset() {
    if (first) {
        first = false;
        return true;
    }
    return false;
}
