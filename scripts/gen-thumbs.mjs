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
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="0.7" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
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
    // bands of latitude well away from the poles -> clean nested tori
    const LATS = [0.30, 0.42, 0.54, 0.66];
    const NLON = 16;
    LATS.forEach((latFrac, li) => {
        const theta = latFrac * Math.PI;
        for (let j = 0; j < NLON; j++) {
            const phi = (j / NLON) * 2 * Math.PI;
            const pts = [];
            for (let k = 0; k <= 160; k++) {
                const t = (k / 160) * 2 * Math.PI;
                // fiber over (theta, phi): standard parametrization on S³
                const x1 = Math.sin(theta / 2) * Math.cos(t + phi);
                const x2 = Math.sin(theta / 2) * Math.sin(t + phi);
                const x3 = Math.cos(theta / 2) * Math.cos(t);
                const x4 = Math.cos(theta / 2) * Math.sin(t);
                const d = 1.12 - x4; // stereographic from (0,0,0,1), softened pole
                let p = rot([x1 / d, x2 / d, x3 / d]);
                const persp = 4.5 / (4.5 + p[2]);
                pts.push([W / 2 + p[0] * 150 * persp, H / 2 + 10 + p[1] * 138 * persp, p[2]]);
            }
            const zAvg = pts.reduce((s, p) => s + p[2], 0) / pts.length;
            rings.push({ pts, zAvg, t: li / (LATS.length - 1) });
        }
    });
    rings.sort((a, b) => b.zAvg - a.zAvg);
    for (const r of rings) {
        const col = lerpColor(ICE, TEAL, r.t);
        const op = 0.25 + 0.45 * (1 - (r.zAvg + 1.5) / 3);
        art += poly(r.pts, col, 1.4, Math.max(0.18, Math.min(0.85, op)));
    }
    return art;
}

// ---------------------------------------------------------------- nbody
function nbody() {
    const rnd = mulberry32(48);
    const dt = 0.016;
    const MU = 5.2e6; // dominant central mass -> clean ellipses with perturbation
    const bodies = [];
    for (let i = 0; i < 8; i++) {
        const ang = rnd() * Math.PI * 2, r = 95 + i * 38 + rnd() * 20;
        const x = W / 2 + Math.cos(ang) * r, y = H / 2 + Math.sin(ang) * r;
        const v = Math.sqrt(MU / r) * (0.82 + rnd() * 0.3);
        bodies.push({ x, y, vx: -Math.sin(ang) * v, vy: Math.cos(ang) * v, m: 0.8 + rnd() * 2.2, trail: [] });
    }
    for (let s = 0; s < 5200; s++) {
        for (const b of bodies) {
            let dx = W / 2 - b.x, dy = H / 2 - b.y;
            let d2 = dx * dx + dy * dy + 400;
            let f = MU / (d2 * Math.sqrt(d2));
            let ax = dx * f, ay = dy * f;
            for (const o of bodies) {
                if (o === b) continue;
                dx = o.x - b.x; dy = o.y - b.y;
                d2 = dx * dx + dy * dy + 2500;
                f = (2.2e4 * o.m) / (d2 * Math.sqrt(d2));
                ax += dx * f; ay += dy * f;
            }
            b.vx += ax * dt; b.vy += ay * dt;
        }
        for (const b of bodies) {
            b.x += b.vx * dt; b.y += b.vy * dt;
            if (s % 5 === 0) b.trail.push([b.x, b.y]);
        }
    }
    let art = "";
    // squash vertically for a slight ecliptic feel
    const sq = (p) => [W / 2 + (p[0] - W / 2), H / 2 + (p[1] - H / 2) * 0.78];
    bodies.forEach((b, i) => {
        const col = [TEAL, ICE, VIOLET, TEAL, AMBER, ICE, TEAL, VIOLET][i];
        const seg = 30;
        for (let k = 0; k + seg < b.trail.length; k += seg) {
            const frac = k / b.trail.length;
            art += poly(b.trail.slice(k, k + seg + 1).map(sq), col, 1.4, 0.06 + frac * 0.8);
        }
        const last = sq(b.trail[b.trail.length - 1]);
        if (last[0] > 40 && last[0] < W - 40 && last[1] > 40 && last[1] < H - 40) {
            art += `<circle cx="${last[0]}" cy="${last[1]}" r="${2.5 + b.m * 1.2}" fill="${col}"/>`;
            art += `<circle cx="${last[0]}" cy="${last[1]}" r="${7 + b.m * 1.5}" fill="none" stroke="${col}" stroke-opacity="0.35"/>`;
        }
    });
    art += `<circle cx="${W / 2}" cy="${H / 2}" r="8" fill="${AMBER}"/><circle cx="${W / 2}" cy="${H / 2}" r="16" fill="none" stroke="${AMBER}" stroke-opacity="0.5"/><circle cx="${W / 2}" cy="${H / 2}" r="26" fill="none" stroke="${AMBER}" stroke-opacity="0.18"/>`;
    return art;
}

// ---------------------------------------------------------------- music
function music() {
    // harmonic series: partials 1..7 and their sum, stacked like a score
    // Lissajous curves for consonant intervals: unison, octave, fifth, fourth, major third
    let art = "";
    const figs = [
        { a: 1, b: 1, col: TEAL },   // unison
        { a: 1, b: 2, col: ICE },    // octave
        { a: 2, b: 3, col: VIOLET }, // fifth
        { a: 3, b: 4, col: ROSE },   // fourth
        { a: 4, b: 5, col: AMBER },  // major third
    ];
    figs.forEach((f, i) => {
        const cx = 150 + i * ((W - 300) / 4);
        const cy = H / 2 - 80;
        const R = 92;
        const pts = [];
        for (let k = 0; k <= 600; k++) {
            const t = (k / 600) * Math.PI * 2;
            pts.push([cx + R * Math.sin(f.a * t + Math.PI / 2), cy + R * Math.sin(f.b * t)]);
        }
        art += poly(pts, f.col, 2, 0.9);
        // frequency-ratio tick marks below each figure
        art += `<line x1="${cx - 24}" y1="${cy + R + 42}" x2="${cx + 24}" y2="${cy + R + 42}" stroke="${f.col}" stroke-opacity="0.5" stroke-width="1.5"/>`;
    });
    // combined waveform of a major chord underneath
    const yc = H - 165, pts = [];
    for (let i = 0; i <= 800; i++) {
        const x = 110 + ((W - 220) * i) / 800;
        const t = (i / 800) * Math.PI * 2 * 3;
        const v = Math.sin(t * 4) + 0.8 * Math.sin(t * 5) + 0.7 * Math.sin(t * 6);
        pts.push([x, yc + v * 34]);
    }
    art += poly(pts, AMBER, 2.2, 0.9);
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
    art += poly(traj, AMBER, 3, 1, "none", `stroke-dasharray="2 7"`);
    const end = traj[traj.length - 1];
    art += `<circle cx="${end[0]}" cy="${end[1]}" r="6" fill="${AMBER}"/><circle cx="${end[0]}" cy="${end[1]}" r="12" fill="none" stroke="${AMBER}" stroke-opacity="0.5"/>`;
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
    // encapsulation as a cascade: payload gets wrapped layer by layer, then serialized to the wire
    let art = "";
    const layers = [AMBER, TEAL, ICE, VIOLET, ROSE]; // payload, L4..L1
    const rowH = 92, gap = 32;
    const top = 86;
    for (let l = 0; l < 5; l++) {
        const y = top + l * (rowH + gap);
        const headerW = 64;
        const x0 = W / 2 - (170 + l * (headerW + 14));
        const x1 = W / 2 + 170;
        // headers prepended at each layer
        for (let h = l; h >= 1; h--) {
            const hx = x0 + (l - h) * (headerW + 14);
            const col = layers[h];
            art += `<rect x="${hx}" y="${y}" width="${headerW}" height="${rowH}" rx="6" fill="${col}" fill-opacity="0.16" stroke="${col}" stroke-width="1.8"/>`;
            for (let k = 0; k < 3; k++)
                art += `<line x1="${hx + 12}" y1="${y + 26 + k * 18}" x2="${hx + headerW - 12}" y2="${y + 26 + k * 18}" stroke="${col}" stroke-opacity="0.75" stroke-width="2.5"/>`;
        }
        // payload block
        art += `<rect x="${W / 2 - 170 + l * 0}" y="${y}" width="340" height="${rowH}" rx="6" fill="${AMBER}" fill-opacity="0.10" stroke="${AMBER}" stroke-width="2"/>`;
        for (let k = 0; k < 3; k++)
            art += `<line x1="${W / 2 - 140}" y1="${y + 26 + k * 18}" x2="${W / 2 + ([110, 140, 70])[k]}" y2="${y + 26 + k * 18}" stroke="${AMBER}" stroke-opacity="0.6" stroke-width="2.5"/>`;
        // arrow between layers
        if (l < 4)
            art += `<path d="M ${W / 2 + 215} ${y + rowH + 4} L ${W / 2 + 215} ${y + rowH + gap - 4} M ${W / 2 + 209} ${y + rowH + gap - 12} L ${W / 2 + 215} ${y + rowH + gap - 4} L ${W / 2 + 221} ${y + rowH + gap - 12}" fill="none" stroke="rgba(230,240,255,0.45)" stroke-width="2"/>`;
    }
    // the wire: serialized bitstream under the last frame
    const wy = top + 5 * (rowH + gap) + 6;
    const rnd = mulberry32(8);
    let bx = 80;
    while (bx < W - 90) {
        const bw = 5 + rnd() * 16;
        const col = [ROSE, VIOLET, ICE, TEAL, AMBER][Math.floor(rnd() * 5)];
        if (rnd() > 0.3) art += `<rect x="${bx}" y="${wy}" width="${bw}" height="10" fill="${col}" fill-opacity="0.8"/>`;
        bx += bw + 4;
    }
    return art;
}

// ---------------------------------------------------------------- openai crisis (bifurcation)
function bifurcation() {
    let art = "";
    const rMin = 2.75, rMax = 4.0;
    const x0 = 70, x1 = W - 70, y0 = H - 80, y1 = 70;
    const COLS = 1300;
    // soft additive glow
    art += `<g filter="url(#soft)">`;
    let dots = "";
    for (let i = 0; i <= COLS; i++) {
        const r = rMin + ((rMax - rMin) * i) / COLS;
        let x = 0.5;
        for (let k = 0; k < 180; k++) x = r * x * (1 - x); // settle to attractor
        const seen = new Set();
        const t = (r - rMin) / (rMax - rMin);
        const px = x0 + (x1 - x0) * t;
        for (let k = 0; k < 200; k++) {
            x = r * x * (1 - x);
            const key = Math.round(x * 6000);
            if (seen.has(key)) continue;
            seen.add(key);
            const py = y0 + (y1 - y0) * x;
            // teal in the periodic regime, cooling to ice, amber in chaos
            const col = t < 0.5 ? TEAL : t < 0.74 ? lerpColor(TEAL, ICE, (t - 0.5) / 0.24) : lerpColor(ICE, AMBER, (t - 0.74) / 0.26);
            const op = t < 0.62 ? 0.9 : Math.max(0.12, 0.5 - (t - 0.62) * 0.6);
            const rad = t < 0.62 ? 1.0 : 0.7;
            dots += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${rad}" fill="${col}" fill-opacity="${op.toFixed(2)}"/>`;
        }
    }
    art += dots + `</g>`;
    // onset-of-chaos marker (r ≈ 3.5699)
    const rc = 3.5699, pxc = x0 + (x1 - x0) * (rc - rMin) / (rMax - rMin);
    art += `<line x1="${pxc}" y1="56" x2="${pxc}" y2="${H - 56}" stroke="${AMBER}" stroke-width="1.5" stroke-opacity="0.55" stroke-dasharray="4 6"/>`;
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
    // column guide lines + tick caps
    for (const x of xs) {
        art += `<line x1="${x}" y1="84" x2="${x}" y2="${H - 84}" stroke="rgba(180,200,230,0.09)" stroke-width="1"/>`;
        art += `<rect x="${x - 9}" y="74" width="18" height="3" fill="rgba(180,200,230,0.25)"/>`;
    }
    const pathOf = (pts) => {
        let d = `M ${pts[0][0]} ${pts[0][1]}`;
        for (let k = 1; k < pts.length; k++) {
            const [xa, ya] = pts[k - 1], [xb, yb] = pts[k];
            const mx = (xa + xb) / 2;
            d += ` C ${mx} ${ya}, ${mx} ${yb}, ${xb} ${yb}`;
        }
        return d;
    };
    series.forEach((pts, i) => {
        const hot = i === 3;
        const col = hot ? AMBER : lerpColor(TEAL, VIOLET, i / (rows - 1));
        const d = pathOf(pts);
        if (hot) art += `<path d="${d}" fill="none" stroke="${col}" stroke-width="7" stroke-opacity="0.18" filter="url(#soft)"/>`;
        art += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${hot ? 3 : 1.6}" stroke-opacity="${hot ? 0.95 : 0.5}"/>`;
    });
    series.forEach((pts, i) => {
        const hot = i === 3;
        const col = hot ? AMBER : lerpColor(TEAL, VIOLET, i / (rows - 1));
        for (const [x, y] of pts) {
            art += `<circle cx="${x}" cy="${y}" r="${hot ? 5 : 3.2}" fill="${BG}" stroke="${col}" stroke-width="2"/>`;
            if (hot) art += `<circle cx="${x}" cy="${y}" r="2" fill="${col}"/>`;
        }
    });
    return art;
}

// ---------------------------------------------------------------- aero (F1inSchools): potential flow past a body
function aero() {
    let art = "";
    const a = 95;                 // body radius
    const cx = W * 0.5, cy = H * 0.5;
    const U = 1;
    // streamlines: integrate velocity field of flow past a cylinder
    const ys = [];
    for (let k = -7; k <= 7; k++) ys.push(cy + k * 42);
    art += `<g filter="url(#soft)">`;
    for (const y0 of ys) {
        const pts = [];
        let x = 40, y = y0;
        for (let s = 0; s < 600 && x < W - 30; s++) {
            const rx = x - cx, ry = y - cy;
            const r2 = rx * rx + ry * ry;
            let u, v;
            if (r2 < a * a) { x += 3; continue; } // inside body: skip
            u = U * (1 - (a * a) * (rx * rx - ry * ry) / (r2 * r2));
            v = -U * (2 * a * a * rx * ry / (r2 * r2));
            const sp = Math.hypot(u, v) || 1;
            x += (u / sp) * 3.0;
            y += (v / sp) * 3.0;
            pts.push([x, y]);
        }
        if (pts.length > 4) {
            const dev = Math.abs(y0 - cy);
            const col = dev < 50 ? AMBER : lerpColor(TEAL, ICE, dev / 300);
            art += poly(pts, col, 1.3, dev < 50 ? 0.85 : 0.5);
        }
    }
    art += `</g>`;
    // the body: a teardrop/wing cross-section
    art += `<path d="M ${cx - a} ${cy} Q ${cx - a} ${cy - a * 0.78} ${cx} ${cy - a * 0.78} Q ${cx + a * 1.5} ${cy - a * 0.7} ${cx + a * 1.9} ${cy} Q ${cx + a * 1.5} ${cy + a * 0.7} ${cx} ${cy + a * 0.78} Q ${cx - a} ${cy + a * 0.78} ${cx - a} ${cy} Z" fill="#0c1622" stroke="${TEAL}" stroke-width="1.6" stroke-opacity="0.9"/>`;
    // stagnation points
    art += `<circle cx="${cx - a}" cy="${cy}" r="3" fill="${AMBER}"/><circle cx="${cx + a * 1.9}" cy="${cy}" r="3" fill="${AMBER}"/>`;
    return art;
}

// ---------------------------------------------------------------- hemicycle (Europawahl): parliament seating
function hemicycle() {
    const rnd = mulberry32(2024);
    let art = "";
    const cx = W / 2, cy = H - 78;
    const rInner = 90, rOuter = Math.min(W, H * 2) * 0.42;
    const ROWS = 7;
    // political blocks across the spectrum, left → right (by angle)
    const blocks = [
        { frac: 0.16, col: ROSE },
        { frac: 0.2, col: VIOLET },
        { frac: 0.22, col: ICE },
        { frac: 0.24, col: TEAL },
        { frac: 0.18, col: AMBER },
    ];
    const cum = [];
    let acc = 0;
    for (const b of blocks) { cum.push([acc, acc + b.frac, b.col]); acc += b.frac; }
    for (let row = 0; row < ROWS; row++) {
        const r = rInner + (rOuter - rInner) * (row / (ROWS - 1));
        const seats = Math.round(8 + r / 14);
        for (let i = 0; i < seats; i++) {
            const f = seats === 1 ? 0.5 : i / (seats - 1);
            const ang = Math.PI - f * Math.PI; // π (left) → 0 (right)
            const px = cx + Math.cos(ang) * r;
            const py = cy - Math.sin(ang) * r;
            const blk = cum.find(([lo, hi]) => f >= lo && f < hi) || cum[cum.length - 1];
            const jitter = 0.85 + rnd() * 0.15;
            art += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.4" fill="${blk[2]}" fill-opacity="${jitter.toFixed(2)}"/>`;
        }
    }
    // baseline + a faint star ring nod to the EU flag
    art += `<line x1="${cx - rOuter - 6}" y1="${cy + 2}" x2="${cx + rOuter + 6}" y2="${cy + 2}" stroke="rgba(180,200,230,0.18)" stroke-width="1"/>`;
    for (let k = 0; k < 12; k++) {
        const ang = Math.PI - (k / 11) * Math.PI;
        const px = cx + Math.cos(ang) * (rInner - 34);
        const py = cy - Math.sin(ang) * (rInner - 34);
        if (py < cy - 6) art += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="1.4" fill="${AMBER}" fill-opacity="0.7"/>`;
    }
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
    "f1inschools_hero.png": aero,
    "europawahl_hero.png": hemicycle,
    "verify_hero.png": verify,
    "default.png": flowfield,
};

for (const [file, fn] of Object.entries(jobs)) {
    const svg = svgDoc(fn());
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, file));
    console.log("✓", file);
}
console.log("done →", OUT);
