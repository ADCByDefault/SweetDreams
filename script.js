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
    setInputs();
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
let isReset = true;
playButton.addEventListener("click", () => {
    const status = playButton.getAttribute("status");
    playButton.classList.toggle("play");
    playButton.classList.toggle("pause");
    if (status === "pause") {
        setHerphone();
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
    modList: {
        arcs: {
            name: "arcs",
            type: "range",
            step: 1,
            default: 10,
            min: 5,
            max: 25,
        },
        baseFrequency: {
            name: "baseFrequency",
            type: "range",
            step: 10,
            default: 200,
            min: 100,
            max: 440,
        },
        FrequencyStep: {
            name: "FrequencyStep",
            type: "range",
            step: 5,
            default: 20,
            min: 5,
            max: 150,
        },
        time: {
            name: "time",
            type: "range",
            step: 10,
            default: 100,
            min: 50,
            max: 10000,
        },
        roundOfFirst: {
            name: "roundOfFirst",
            type: "range",
            step: 1,
            default: 40,
            min: 25,
            max: 200,
        },
        killTime: {
            name: "killTime",
            type: "range",
            step: 0.01,
            default: 1,
            min: 0.01,
            max: 2,
        },
        gainTime: {
            name: "gainTime",
            type: "range",
            step: 0.01,
            default: 0.2,
            min: 0.01,
            max: 2,
        },
        maxGain: {
            name: "maxGain",
            type: "range",
            step: 0.01,
            default: 0.2,
            min: 0.01,
            max: 1,
        },
        waveType: {
            name: "waveType",
            type: "menu",
            default: "sine",
            values: ["sine", "square", "sawtooth", "triangle"],
        },
    },
    arcs: 10,
    baseFrequency: 200,
    FrequencyStep: 20,
    time: 100,
    roundOfFirst: 12,
    startingAngle: Math.PI,
    killTime: 2,
    gainTime: 0.1,
    maxGain: 0.2,
    waveType: "sine",
    color: {
        from: "000000",
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
     * @type {number} max amplitude
     */
    static maxGain = herphone.maxGain;
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
            Sound.maxGain,
            audioCtx.currentTime + Sound.gainTime
        );
    }
    /**
     * stops the sound from 0.3A to 0A in Sound.killTime seconds
     */
    stop() {
        this.gain1.gain.linearRampToValueAtTime(
            0,
            audioCtx.currentTime + Sound.killTime
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
        this.onPi = false;
        this.sound = new Sound(frequency);
    }
    /**
     * plays the arc sound and stops it (gainTime and killTime, see Sound class)
     */
    async playSound() {
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
            this.playSound();
            this.onPi = true;
            this.angle += Math.PI * 2;
        }
        if (this.angle < Math.PI && this.onPi) {
            this.playSound();
            this.onPi = false;
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
    console.log(isReset);
    drawBase(ctx, canvas);
    if (!isReset) {
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
    isReset = false;
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

// setting data

const options = document.querySelector("#options");
const toggleOptions = document.querySelector("#toggle");
toggleOptions.addEventListener("click", () => {
    console.log("clicked");
    options.classList.toggle("close");
    options.classList.toggle("open");
});

const form = document.querySelector("#inputs");
function setInputs() {
    const inputs = herphone.modList;
    Object.keys(inputs).forEach((key) => {
        if (inputs[key].type == "range") {
            form.appendChild(createRangeField(inputs[key]));
        }
        if (inputs[key].type == "menu") {
            form.appendChild(createMenuField(inputs[key]));
        }
    });
}
function createRangeField(key) {
    let div = document.createElement("div");
    div.classList.add("input-container");
    let input = document.createElement("input");
    input.classList.add("input-range");
    input.type = "range";
    input.name = key.name;
    input.min = key.min;
    input.max = key.max;
    input.step = key.step;
    input.value = key.default;
    let p = document.createElement("p");
    p.classList.add("input-label");
    let span = document.createElement("span");
    span.innerText = key.default;
    p.innerText = key.name + ": ";
    p.appendChild(span);
    div.appendChild(p);
    div.appendChild(input);
    input.addEventListener("input", (e) => {
        span.innerText = input.value;
        let target = e.target;
        reset(target.name, target.value);
    });
    return div;
}
function createMenuField(key) {
    let div = document.createElement("div");
    div.classList.add("input-container");
    let select = document.createElement("select");
    select.name = key.name;
    select.classList.add("input-menu");
    key.values.forEach((value) => {
        let option = document.createElement("option");
        option.value = value;
        option.innerText = value;
        select.appendChild(option);
    });
    div.appendChild(select);
    select.addEventListener("change", (e) => {
        let target = e.target;
        reset(target.name, target.value);
    });
    return div;
}

function reset(name, value) {
    herphone[name] = value;
    isReset = true;
    if (playButton.classList.contains("play")) {
        playButton.click();
    }
}

function setHerphone() {}
