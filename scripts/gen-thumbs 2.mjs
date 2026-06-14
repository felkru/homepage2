// Generative algorithmic-art thumbnails for blog posts.
// Deterministic (seeded PRNG), rendered as SVG and rasterized with sharp.
// Run: node scripts/gen-thumbs.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "src", "assets", "thumbs");
mkdirSync(OUT, { recursive: true });

const W = 1280, H = 800;
const BG = "#0A0E14";
const GRID = "rgba(150,170,200,0.045)";
const FRAME = "rgba(150,170,200,0.14)";
const TEAL = "#5EEAD4";
const ICE = "#7DD3FC";
const AMBER = "#F5A623";
const ROSE = "#F472B6";
const VIOLET = "#A78BFA";

function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function chrome() {
    // shared backdrop: vignette gradient, fine grid, inset frame + corner ticks
    let g = `<defs>
      <radialGradient id="vig" cx="50%" cy="42%" r="75%">
        <stop offset="0%" stop-color="#101826"/>
        <stop offset="100%" stop-color="${BG}"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#vig)"/>`;
    for (let x = 64; x < W; x += 64) g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${GRID}" stroke-width="1"/>`;
    for (let y = 48; y < H; y += 64) g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${GRID}" stroke-width="1"/>`;
    const m = 28, t = 14;
    g += `<rect x="${m}" y="${m}" width="${W - 2 * m}" height="${H - 2 * m}" fill="none" stroke="${FRAME}" stroke-width="1"/>`;
    for (const [cx, cy, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
        g += `<path d="M ${cx + dx * t} ${cy} L ${cx} ${cy} L ${cx} ${cy + dy * t}" fill="none" stroke="rgba(230,240,255,0.5)" stroke-width="2"/>`;
    }
    return g;
}

const svgDoc = (inner) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${chrome()}${inner}</svg>`;

function poly(pts, stroke, width, opacity = 1, fill = "none", extra = "") {
    const d = pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
    return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-opacity="${opacity}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
}

function lerpColor(c1, c2, t) {
    const a = c1.match(/\w\w/g).map((x) => parseInt(x, 16));
    const b = c2.match(/\w\w/g).map((x) => parseInt(x, 16));
    return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------- hopf
// Genuine Hopf fibration: fibers of points on S² → circles on S³,
// stereographically projected to R³, then rotated + orthographically drawn.
function hopf() {
    let art = "";
    const rings = [];
    const rot = (p) => {
        // rotate around x then y for a pleasant viewing angle
        const [x, y, z] = p, a = 0.45, b = 0.6;
        const y1 = y * Math.cos(a) - z * Math.sin(a), z1 = y * Math.sin(a) + z * Math.cos(a);
        const x2 = x * Math.cos(b) + z1 * Math.sin(b), z2 = -x * Math.sin(b) + z1 * Math.cos(b);
        return [x2, y1, z2];
    };
    const NLAT = 7, NLON = 11;
    for (let i = 1; i < NLAT; i++) {
        const theta = (i / NLAT) * Math.PI; // latitude on S²
        for (let j = 0; j < NLON; j++) {
            const phi = (j / NLON) * 2 * Math.PI + i * 0.35;
            const pts = [];
            for (let k = 0; k <= 140; k++) {
                const t = (k / 140) * 2 * Math.PI;
                // fiber over (theta, phi): standard parametrization on S³
                const x1 = Math.cos((phi + t) / 1) * Math.sin(theta / 2);
                const x2 = Math.sin((phi + t) / 1) * Math.sin(theta / 2);
                const x3 = Math.cos(t - phi) * Math.cos(theta / 2);
                const x4 = Math.sin(t - phi) * Math.cos(theta / 2);
                const d = 1.0001 - x4; // stereographic from (0,0,0,1)
                let p = rot([x1 / d, x2 / d, x3 / d]);
                const persp = 3.2 / (3.2 + p[2]);
                pts.push([W / 2 + p[0] * 215 * persp, H / 2 + 20 + p[1] * 215 * persp, p[2]]);
            }
            const zAvg = pts.reduce((s, p) => s + p[2], 0) / pts.length;
            rings.push({ pts, zAvg, t: i / NLAT });
        }
    }
    rings.sort((a, b) => b.zAvg - a.zAvg);
    for (const r of rings) {
        const col = lerpColor(ICE, TEAL, r.t);
        const op = 0.18 + 0.5 * (1 - (r.zAvg + 2) / 4);
        art += poly(r.pts, col, 1.3, Math.max(0.12, Math.min(0.75, op)));
    }
    return art;
}

// ---------------------------------------------------------------- nbody
function nbody() {
    const rnd = mulberry32(42);
    const G = 1800, dt = 0.016;
    const bodies = [];
    for (let i = 0; i < 9; i++) {
        const ang = rnd() * Math.PI * 2, r = 120 + rnd() * 200;
        const x = W / 2 + Math.cos(ang) * r, y = H / 2 + Math.sin(ang) * r * 0.62;
        const v = Math.sqrt(G * 14 / r) * (0.75 + rnd() * 0.4);
        bodies.push({ x, y, vx: -Math.sin(ang) * v, vy: Math.cos(ang) * v * 0.8, m: 0.6 + rnd() * 2.4, trail: [] });
    }
    const center = { x: W / 2, y: H / 2, m: 14 };
    for (let s = 0; s < 2600; s++) {
        for (const b of bodies) {
            let ax = 0, ay = 0;
            const others = [...bodies.filter((o) => o !== b), center];
            for (const o of others) {
                const dx = o.x - b.x, dy = o.y - b.y;
                const d2 = dx * dx + dy * dy + 900;
                const f = (G * o.m) / (d2 * Math.sqrt(d2));
                ax += dx * f; ay += dy * f;
            }
            b.vx += ax * dt * 60; b.vy += ay * dt * 60;
        }
        for (const b of bodies) {
            b.x += b.vx * dt; b.y += b.vy * dt;
            if (s % 3 === 0) b.trail.push([b.x, b.y]);
        }
    }
    let art = "";
    bodies.forEach((b, i) => {
        const col = [TEAL, ICE, VIOLET, TEAL, ICE, AMBER, TEAL, ICE, VIOLET][i];
        const seg = 36;
        for (let k = 0; k + seg < b.trail.length; k += seg) {
            const frac = k / b.trail.length;
            art += poly(b.trail.slice(k, k + seg + 1), col, 1.1, 0.05 + frac * 0.55);
        }
        const last = b.trail[b.trail.length - 1];
        if (last && last[0] > 40 && last[0] < W - 40 && last[1] > 40 && last[1] < H - 40)
            art += `<circle cx="${last[0]}" cy="${last[1]}" r="${2 + b.m}" fill="${col}"/>`;
    });
    art += `<circle cx="${W / 2}" cy="${H / 2}" r="7" fill="${AMBER}"/><circle cx="${W / 2}" cy="${H / 2}" r="14" fill="none" stroke="${AMBER}" stroke-opacity="0.4"/>`;
    return art;
}

// ---------------------------------------------------------------- music
function music() {
    // harmonic series: partials 1..7 and their sum, stacked like a score
    let art = "";
    const x0 = 110, x1 = W - 110;
    for (let h = 1; h <= 7; h++) {
        const yc = 92 + (h - 1) * 82;
        const amp = 26 / Math.sqrt(h);
        const pts = [];
        for (let i = 0; i <= 360; i++) {
            const x = x0 + ((x1 - x0) * i) / 360;
            pts.push([x, yc + amp * Math.sin((i / 360) * Math.PI * 2 * h)]);
        }
        const col = lerpColor(TEAL, VIOLET, (h - 1) / 6);
        art += poly(pts, col, 1.6, 0.85);
        art += `<circle cx="${x0 - 26}" cy="${yc}" r="3" fill="${col}" fill-opacity="0.9"/>`;
    }
    // the chord: weighted sum, drawn bold in amber underneath
    const yc = 92 + 7 * 82, pts = [];
    for (let i = 0; i <= 720; i++) {
        const x = x0 + ((x1 - x0) * i) / 720;
        let v = 0;
        for (let h = 1; h <= 7; h++) v += (26 / (h * 1.2)) * Math.sin((i / 720) * Math.PI * 2 * h);
        pts.push([x, yc + v * 0.85]);
    }
    art += poly(pts, AMBER, 2.4, 0.95);
    return art;
}

// ---------------------------------------------------------------- loss landscape (ridgeline)
function loss() {
    const rnd = mulberry32(7);
    const peaks = [];
    for (let i = 0; i < 7; i++)
        peaks.push({ x: rnd() * 2 - 1, z: rnd() * 2 - 1, h: 40 + rnd() * 150, s: 0.08 + rnd() * 0.22 });
    const f = (x, z) => {
        let v = 0;
        for (const p of peaks) {
            const d2 = (x - p.x) ** 2 + (z - p.z) ** 2;
            v += p.h * Math.exp(-d2 / p.s);
        }
        return v;
    };
    let art = "";
    const ROWS = 26, COLS = 160;
    for (let r = 0; r < ROWS; r++) {
        const z = -1 + (2 * r) / (ROWS - 1);
        const yBase = 150 + r * 21;
        const pts = [];
        for (let c = 0; c <= COLS; c++) {
            const x = -1.25 + (2.5 * c) / COLS;
            const px = 90 + ((W - 180) * c) / COLS;
            pts.push([px, yBase - f(x, z)]);
        }
        // hidden-line: fill below each ridge with bg
        const fillPts = [...pts, [W - 90, yBase + 22], [90, yBase + 22]];
        const d = fillPts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z";
        art += `<path d="${d}" fill="${BG}" fill-opacity="0.92" stroke="none"/>`;
        const col = lerpColor(ICE, TEAL, r / (ROWS - 1));
        art += poly(pts, col, 1.5, 0.4 + 0.5 * (r / ROWS));
    }
    // SGD trajectory rolling into a minimum
    const traj = [];
    let tx = -0.95, tz = -0.8;
    for (let i = 0; i < 60; i++) {
        const eps = 0.012;
        const gx = (f(tx + eps, tz) - f(tx - eps, tz)) / (2 * eps);
        const gz = (f(tx, tz + eps) - f(tx, tz - eps)) / (2 * eps);
        tx -= 0.0016 * gx + (rnd() - 0.5) * 0.02;
        tz -= 0.0016 * gz + (rnd() - 0.5) * 0.02;
        tz = Math.min(1, Math.max(-1, tz)); tx = Math.min(1.2, Math.max(-1.2, tx));
        const r = ((tz + 1) / 2) * (ROWS - 1);
        const px = 90 + ((W - 180) * (tx + 1.25)) / 2.5;
        traj.push([px, 150 + r * 21 - f(tx, tz)]);
    }
    art += poly(traj, AMBER, 2.2, 0.95, "none", `stroke-dasharray="1 6"`);
    const end = traj[traj.length - 1];
    art += `<circle cx="${end[0]}" cy="${end[1]}" r="5" fill="${AMBER}"/>`;
    return art;
}

// ---------------------------------------------------------------- fingerprinting (telemetry channels)
function fingerprint() {
    const rnd = mulberry32(1337);
    let art = "";
    const channels = [
        { col: TEAL, base: 150 }, // power
        { col: ICE, base: 310 }, // acoustic
        { col: VIOLET, base: 470 }, // EM
        { col: ROSE, base: 630 }, // thermal
    ];
    const x0 = 90, x1 = W - 90, N = 520;
    const burstA = 0.42, burstB = 0.62; // shared anomaly window: the "fingerprint"
    channels.forEach((ch, ci) => {
        const pts = [];
        let v = 0;
        for (let i = 0; i <= N; i++) {
            const t = i / N;
            const x = x0 + (x1 - x0) * t;
            v = v * 0.92 + (rnd() - 0.5) * 9;
            let y = ch.base + v + Math.sin(t * 40 + ci * 9) * 4;
            if (t > burstA && t < burstB) {
                const env = Math.sin(((t - burstA) / (burstB - burstA)) * Math.PI);
                y += Math.sin(t * (340 + ci * 60)) * 34 * env + (rnd() - 0.5) * 14 * env;
            }
            pts.push([x, y]);
        }
        art += poly(pts, ch.col, 1.5, 0.9);
        art += `<line x1="${x0 - 18}" y1="${ch.base}" x2="${x0 - 6}" y2="${ch.base}" stroke="${ch.col}" stroke-width="2"/>`;
    });
    // highlight the matched window
    const bx0 = x0 + (x1 - x0) * burstA, bx1 = x0 + (x1 - x0) * burstB;
    art += `<rect x="${bx0}" y="70" width="${bx1 - bx0}" height="${H - 140}" fill="${AMBER}" fill-opacity="0.05" stroke="${AMBER}" stroke-opacity="0.55" stroke-width="1.5" stroke-dasharray="5 5"/>`;
    return art;
}

// ---------------------------------------------------------------- protocol stack (encapsulation)
function protocol() {
    let art = "";
    const layers = [
        { col: TEAL, label: 4 },
        { col: ICE, label: 3 },
        { col: VIOLET, label: 2 },
        { col: ROSE, label: 1 },
    ];
    const cx = W / 2, cy = H / 2;
    layers.forEach((l, i) => {
        const w = 260 + i * 220, h = 130 + i * 152;
        art += `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="8" fill="none" stroke="${l.col}" stroke-width="2" stroke-opacity="${0.85 - i * 0.13}"/>`;
        // header block on each layer's left edge
        art += `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${36 + i * 8}" height="${h}" rx="8" fill="${l.col}" fill-opacity="${0.16 - i * 0.025}" stroke="none"/>`;
    });
    // payload core
    art += `<rect x="${cx - 95}" y="${cy - 36}" width="190" height="72" rx="6" fill="${AMBER}" fill-opacity="0.14" stroke="${AMBER}" stroke-width="2"/>`;
    for (let i = 0; i < 6; i++)
        art += `<line x1="${cx - 72}" y1="${cy - 18 + i * 7.5}" x2="${cx + ([52, 70, 30, 64, 44, 58])[i]}" y2="${cy - 18 + i * 7.5}" stroke="${AMBER}" stroke-opacity="0.7" stroke-width="2.5"/>`;
    // transmission line out the right
    const y = cy;
    let d = `M ${cx + 95 + 220 + 110} ${y}`;
    art += `<line x1="${W - 220}" y1="${y}" x2="${W - 60}" y2="${y}" stroke="${TEAL}" stroke-opacity="0.0"/>`;
    return art;
}

// ---------------------------------------------------------------- openai crisis (bifurcation)
function bifurcation() {
    let art = "";
    const rMin = 2.8, rMax = 4.0;
    const x0 = 80, x1 = W - 80, y0 = H - 90, y1 = 80;
    let dots = "";
    for (let i = 0; i <= 620; i++) {
        const r = rMin + ((rMax - rMin) * i) / 620;
        let x = 0.5;
        for (let k = 0; k < 90; k++) x = r * x * (1 - x); // settle
        const seen = new Set();
        for (let k = 0; k < 110; k++) {
            x = r * x * (1 - x);
            const key = Math.round(x * 4000);
            if (seen.has(key)) continue;
            seen.add(key);
            const px = x0 + ((x1 - x0) * (r - rMin)) / (rMax - rMin);
            const py = y0 + (y1 - y0) * x;
            const t = (r - rMin) / (rMax - rMin);
            const col = t < 0.45 ? TEAL : t < 0.72 ? ICE : AMBER;
            const op = t < 0.45 ? 0.85 : Math.max(0.16, 0.55 - (t - 0.45));
            dots += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="1.05" fill="${col}" fill-opacity="${op.toFixed(2)}"/>`;
        }
    }
    art += dots;
    // marker at onset of chaos (r ≈ 3.57)
    const rc = 3.5699, pxc = x0 + ((x1 - x0) * (rc - rMin)) / (rMax - rMin);
    art += `<line x1="${pxc}" y1="60" x2="${pxc}" y2="${H - 60}" stroke="${AMBER}" stroke-width="1.5" stroke-opacity="0.6" stroke-dasharray="4 6"/>`;
    return art;
}

// ---------------------------------------------------------------- rankings (bump chart)
function rankings() {
    const rnd = mulberry32(2024);
    let art = "";
    const cols = 5, rows = 9;
    const xs = Array.from({ length: cols }, (_, i) => 140 + ((W - 280) * i) / (cols - 1));
    // build permutations: each university's rank trajectory across ranking systems
    let order = Array.from({ length: rows }, (_, i) => i);
    const series = Array.from({ length: rows }, () => []);
    for (let c = 0; c < cols; c++) {
        if (c > 0) {
            // shuffle a bit: swap neighbours randomly (rankings disagree)
            for (let s = 0; s < 6; s++) {
                const i = Math.floor(rnd() * (rows - 1));
                if (rnd() < 0.7) [order[i], order[i + 1]] = [order[i + 1], order[i]];
            }
        }
        order.forEach((uni, rank) => series[uni].push([xs[c], 120 + (rank * (H - 240)) / (rows - 1)]));
    }
    series.forEach((pts, i) => {
        const col = i === 3 ? AMBER : lerpColor(TEAL, VIOLET, i / (rows - 1));
        const wgt = i === 3 ? 3 : 1.6;
        // smooth bezier between columns
        let d = `M ${pts[0][0]} ${pts[0][1]}`;
        for (let k = 1; k < pts.length; k++) {
            const [xa, ya] = pts[k - 1], [xb, yb] = pts[k];
            const mx = (xa + xb) / 2;
            d += ` C ${mx} ${ya}, ${mx} ${yb}, ${xb} ${yb}`;
        }
        art += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${wgt}" stroke-opacity="${i === 3 ? 0.95 : 0.55}"/>`;
        for (const [x, y] of pts) art += `<circle cx="${x}" cy="${y}" r="${i === 3 ? 4.5 : 3}" fill="${BG}" stroke="${col}" stroke-width="2"/>`;
    });
    for (const x of xs) art += `<line x1="${x}" y1="84" x2="${x}" y2="${H - 84}" stroke="rgba(180,200,230,0.10)" stroke-width="1"/>`;
    return art;
}

// ---------------------------------------------------------------- verify agents (merkle/attestation tree)
function verify() {
    let art = "";
    const levels = 4;
    const nodePos = [];
    for (let l = 0; l < levels; l++) {
        const n = 2 ** l;
        const row = [];
        for (let i = 0; i < n; i++) {
            const x = (W * (i + 0.5)) / n;
            const y = 130 + (l * (H - 260)) / (levels - 1);
            row.push([x, y]);
        }
        nodePos.push(row);
    }
    for (let l = 0; l < levels - 1; l++) {
        nodePos[l].forEach(([x, y], i) => {
            for (const c of [2 * i, 2 * i + 1]) {
                const [cx2, cy2] = nodePos[l + 1][c];
                art += `<path d="M ${x} ${y + 16} C ${x} ${y + 70}, ${cx2} ${cy2 - 70}, ${cx2} ${cy2 - 16}" fill="none" stroke="${lerpColor(TEAL, VIOLET, l / 2)}" stroke-width="1.5" stroke-opacity="0.55"/>`;
            }
        });
    }
    const rnd = mulberry32(99);
    nodePos.forEach((row, l) =>
        row.forEach(([x, y], i) => {
            const isRoot = l === 0;
            const col = isRoot ? AMBER : lerpColor(TEAL, VIOLET, l / (levels - 1));
            const r = isRoot ? 22 : 16 - l * 1.5;
            art += `<rect x="${x - r}" y="${y - r * 0.7}" width="${2 * r}" height="${r * 1.4}" rx="4" fill="${BG}" stroke="${col}" stroke-width="${isRoot ? 2.5 : 1.6}"/>`;
            // hash glyph: random tick marks inside
            for (let k = 0; k < 3; k++) {
                const wseg = (0.4 + rnd() * 0.5) * r;
                art += `<line x1="${x - r + 6}" y1="${y - 5 + k * 5}" x2="${x - r + 6 + wseg}" y2="${y - 5 + k * 5}" stroke="${col}" stroke-opacity="0.8" stroke-width="2"/>`;
            }
        })
    );
    return art;
}

// ---------------------------------------------------------------- default (flow field)
function flowfield() {
    const rnd = mulberry32(555);
    let art = "";
    const angle = (x, y) =>
        Math.sin(x * 0.004) * 2.1 + Math.cos(y * 0.006) * 1.7 + Math.sin((x + y) * 0.002) * 1.3;
    for (let i = 0; i < 240; i++) {
        let x = rnd() * W, y = rnd() * H;
        const pts = [[x, y]];
        for (let s = 0; s < 70; s++) {
            const a = angle(x, y);
            x += Math.cos(a) * 6; y += Math.sin(a) * 6;
            if (x < 40 || x > W - 40 || y < 40 || y > H - 40) break;
            pts.push([x, y]);
        }
        if (pts.length < 8) continue;
        const t = rnd();
        const col = t < 0.85 ? lerpColor(TEAL, ICE, rnd()) : AMBER;
        art += poly(pts, col, 1.1, 0.1 + rnd() * 0.4);
    }
    return art;
}

const jobs = {
    "hopf_hero.png": hopf,
    "nbody_hero.png": nbody,
    "music_hero.png": music,
    "optimizers_hero.png": loss,
    "fingerprint_hero.png": fingerprint,
    "warden_hero.png": protocol,
    "openai_crisis.png": bifurcation,
    "rankings_hero.png": rankings,
    "verify_hero.png": verify,
    "default.png": flowfield,
};

for (const [file, fn] of Object.entries(jobs)) {
    const svg = svgDoc(fn());
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, file));
    console.log("✓", file);
}
console.log("done →", OUT);
