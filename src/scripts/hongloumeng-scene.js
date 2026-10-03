/**
 * 红楼雪夜 — 逐像素绘制的大观园雪景场景（canvas 2D，双画布：场景 + 匾额文字）
 *
 * 来源：AI 设计稿（dc 格式）中的 Component 类，外壳从 React/DCLogic 改写为原生 JS，
 * 内部绘制逻辑逐字保留，画面与原设计一致。
 *
 * 用法：import { startScene } from "@/scripts/hongloumeng-scene";
 *       startScene(canvas, textCanvas);
 */

const PROPS = { pixelSize: 0, speed: 1, parallax: true, snow: 1 };

export class HongloumengScene {
  props = { ...PROPS };
  t = 0;
  mx = 0;
  mt = 0;
  last = 0;
  acc = 0;
  petals = [];
  plates = [];
  plaques = [];
  BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  constructor(canvas, textCanvas, props) {
    this.canvasRef = { current: canvas };
    this.textRef = { current: textCanvas };
    if (props) Object.assign(this.props, props);
  }

  mount() {
    this.reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.ctx = this.canvasRef.current.getContext('2d');
    this.tctx = this.textRef.current.getContext('2d');
    this.R = this.painter(this.ctx);
    this.build();
    this.resize = () => this.build();
    this.onMove = e => { this.mt = (e.clientX / window.innerWidth) * 2 - 1; };
    this.onVis = () => { this.hidden = document.hidden; this.last = performance.now(); };
    window.addEventListener('resize', this.resize); window.addEventListener('pointermove', this.onMove); document.addEventListener('visibilitychange', this.onVis);
    this.onDown = e => { const px = this.px || 2, r = Math.random, x = e.clientX / px, y = e.clientY / px; for (let i = 0; i < 12; i++) this.petals.push({ x: x + (r() - 0.5) * 12, y: y + (r() - 0.5) * 8, ph: r() * 6, v: (8 + r() * 14) * (this.u || 1), c: r() < 0.5 ? '#c8283a' : '#e86a7a' }); if (this.petals.length > 50) this.petals.splice(0, this.petals.length - 50); };
    this.canvasRef.current.addEventListener('pointerdown', this.onDown);
    this.last = performance.now();
    const loop = now => { this.raf = requestAnimationFrame(loop); if (!this.hidden) this.frame(now); };
    this.raf = requestAnimationFrame(loop);
  }
  unmount() {
    cancelAnimationFrame(this.raf); window.removeEventListener('resize', this.resize); window.removeEventListener('pointermove', this.onMove); document.removeEventListener('visibilitychange', this.onVis);
    this.canvasRef.current.removeEventListener('pointerdown', this.onDown);
  }

  mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
  hx(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  rng(seed) { let s = seed; return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  painter(x) { return (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); }; }
  vn(x, y) { const h = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); }, ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy); return (h(ix, iy) * (1 - u) + h(ix + 1, iy) * u) * (1 - w) + (h(ix, iy + 1) * (1 - u) + h(ix + 1, iy + 1) * u) * w; }
  mixc(h1, h2, t) { const a = this.hx(h1), b = this.hx(h2); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
  bay(x, y) { return (this.BAY[(y & 3) * 4 + (x & 3)] + 0.5) / 16; }
  gradImg(x, W, H, ramp, curve) {
    const img = x.createImageData(W, H), d = img.data, C = ramp.map(h => this.hx(h)), n = C.length - 1;
    for (let y = 0; y < H; y++) { const f = Math.pow(y / Math.max(1, H - 1), curve) * n, b = Math.floor(f), fr = f - b;
      for (let xx = 0; xx < W; xx++) { const c0 = C[Math.min(n, b)], c1 = C[Math.min(n, b + 1)], i = (y * W + xx) * 4, nz = (((xx * 73856093) ^ (y * 19349663)) & 255) / 255 - 0.5; for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, Math.round(c0[k] + (c1[k] - c0[k]) * fr + nz * 2.4))); d[i + 3] = 255; } }
    x.putImageData(img, 0, 0);
  }
  glow(r, hex) {
    r = Math.max(2, Math.round(r)); const key = r + hex; if (this.glowC[key]) return this.glowC[key];
    const s = 2 * r + 1, [c, x] = this.mk(s, s), img = x.createImageData(s, s), d = img.data, col = this.hx(hex);
    for (let yy = 0; yy < s; yy++) for (let xx = 0; xx < s; xx++) { const dd = Math.hypot(xx - r, yy - r) / r; if (dd >= 1) continue; const a = Math.pow(1 - dd, 1.7), lv = Math.max(0, a + ((((xx * 73856093) ^ (yy * 19349663)) & 255) / 255 - 0.5) * 0.025), i = (yy * s + xx) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = Math.min(255, lv * 255); }
    x.putImageData(img, 0, 0); return this.glowC[key] = c;
  }
  blit(x, c, cx, cy, a) { const rr = (c.width - 1) / 2; x.globalAlpha = Math.max(0, Math.min(1, a)); x.drawImage(c, Math.round(cx - rr), Math.round(cy - rr)); x.globalAlpha = 1; }
  pl(R, x0, y0, x1, y1, th, col) { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))), o = (th - 1) / 2; for (let i = 0; i <= n; i++) { const a = i / n; R(x0 + (x1 - x0) * a - o, y0 + (y1 - y0) * a - o, th, th, col); } }

  build() {
    const c = this.canvasRef.current, tc = this.textRef.current; if (!c || !tc) return;
    const W = Math.max(320, window.innerWidth || 0), H = Math.max(360, window.innerHeight || 0), mob = W < 700;
    const px = this.props.pixelSize > 0 ? Math.round(this.props.pixelSize) : Math.max(2, Math.round(H / 380));
    const PW = Math.ceil(W / px), PH = Math.ceil(H / px), u = PH / 360, M = 10, dpr = Math.min(2, window.devicePixelRatio || 1);
    Object.assign(this, { W, H, mob, px, PW, PH, u, M, FW: PW + 2 * M, dpr, glowC: {}, S: Math.min(1, PW / (PH * 1.15)) });
    this.q = v => Math.round(v * u);
    c.width = PW; c.height = PH; this.ctx.imageSmoothingEnabled = false;
    tc.width = Math.round(W * dpr); tc.height = Math.round(H * dpr);
    this.gy = Math.round(PH * 0.66); this.wins = []; this.plaques = [];
    this.buildSky(); this.buildMid(); this.buildGround(); this.buildPlum(); this.buildCrowd(); this.buildFx(); this.buildGrade();
  }

  buildSky() {
    const { FW, PW, M, gy, q, u } = this, [c, x] = this.mk(FW, this.PH), R = this.painter(x), r = this.rng(4); this.L0 = c;
    const [gc, gx] = this.mk(FW, gy + 2); this.gradImg(gx, FW, gy + 2, ['#766a92', '#8e7b9c', '#a987a2', '#c396a2', '#d9a8a2', '#e8bca8', '#f2d0b6'], 0.85); x.drawImage(gc, 0, 0);
    const mx = M + Math.round(PW * (this.mob ? 0.3 : 0.66)), my = q(40), mr = Math.max(4, q(10));
    this.blit(x, this.glow(mr * 3.2, '#ffe8d0'), mx, my, 0.55);
    for (let yy = -mr; yy <= mr; yy++) for (let xx = -mr; xx <= mr; xx++) { const d = Math.hypot(xx, yy) / mr; if (d > 1.02) continue; let col = d > 0.86 ? '#f6e4cc' : '#fff4e2'; if ((xx + yy) / mr > 0.35 && this.bay(xx + 64, yy + 64) < (xx + yy) / mr - 0.35) col = '#efdac2'; R(mx + xx, my + yy, 1, 1, col); }
    [[-0.35, -0.25, 0.24], [0.3, 0.2, 0.17], [-0.05, 0.5, 0.13]].forEach(([a, b, s]) => { const cx = Math.round(mx + a * mr), cy = Math.round(my + b * mr), rr = Math.max(1, Math.round(s * mr)); for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr; xx <= rr; xx++) if (xx * xx + yy * yy <= rr * rr) R(cx + xx, cy + yy, 1, 1, '#ecd6c0'); });
    const ridge = (base, amp, sd, body, lit, cap) => { for (let xx = 0; xx < FW; xx++) { const X = xx / u, hgt = amp * (0.5 + 0.3 * Math.sin(X * 0.011 + sd) + 0.15 * Math.sin(X * 0.034 + sd * 2) + 0.05 * Math.sin(X * 0.1 + sd)), top = Math.round(base - hgt); R(xx, top, 1, gy + 2 - top, body); const sn = Math.max(1, Math.round(q(4) * (0.45 + 0.55 * Math.sin(X * 0.045 + sd)))); for (let k = 0; k < sn; k++) if (k === 0 || this.bay(xx, top + k) < 1 - k / sn) R(xx, top + k, 1, 1, cap); if (r() < 0.08) R(xx, top + sn + 1 + Math.floor(r() * q(6)), 1, q(2), lit); } };
    const cloud = (cx, cy, w, h, sd) => { for (let yy = -h; yy <= h; yy++) for (let xx = -w; xx <= w; xx++) { const nz = this.vn(xx * 0.09 + sd, yy * 0.22 + sd) * 0.55 + this.vn(xx * 0.25 + sd, yy * 0.5) * 0.25, d = (xx / w) ** 2 + (yy / h) ** 2 * 1.5 + (nz - 0.4) * 0.8; if (d > 1) continue; const top = yy < -h * 0.15 && d < 0.84, rim = yy < 0 && d > 0.8, sh = yy > h * 0.25 || (this.vn(xx * 0.15 + sd, yy * 0.4 + 9) > 0.62 && yy > 0); R(cx + xx, cy + yy, 1, 1, rim ? '#fbe6dc' : top ? (this.vn(xx * 0.3, yy * 0.6) < 0.45 ? '#f6d2cc' : '#f0c0c4') : sh ? '#b68ca8' : '#d4a0b4'); } };
    [[0.14, 28, 70, 7], [0.36, 56, 90, 8], [0.84, 74, 80, 6], [0.5, 96, 110, 7], [0.2, 118, 90, 5], [0.76, 112, 60, 5], [0.05, 70, 50, 5]].forEach(([fx, cyy, cw, ch], i) => { const cx = M + Math.round(PW * fx), cy = q(cyy), w = Math.round(q(cw) * 0.9), h = q(ch); if (Math.abs(cx - mx) < w + mr * 2 && Math.abs(cy - my) < h + mr * 2) return; cloud(cx, cy, w, h, i * 17); });
    ridge(gy - q(34), q(44), 1.2, '#a292ac', '#b8a8bc', '#ece2e8'); ridge(gy - q(16), q(28), 3.4, '#8f7c9c', '#a896b0', '#e0d4de');
    { const wt0 = gy - q(34); for (let xx = 0; xx < FW; xx += 3 + Math.floor(r() * 4)) { const th = q(7 + r() * 10), hw = Math.max(2, Math.round(th * 0.28)), pine = r() < 0.6; for (let k = 0; k < th; k++) { const f = k / th, w2 = pine ? Math.round(hw * f * 1.1) : (k > th * 0.55 ? Math.round(hw * Math.sin((f - 0.55) / 0.45 * 3) * 1.2) : 0); for (let a = -w2; a <= w2; a++) R(xx + a, wt0 - th + k, 1, 1, pine ? (k % 4 === 0 && Math.abs(a) < w2 ? '#e6dcea' : (a < 0 ? '#4c4270' : '#3a3158')) : (a === 0 ? '#2e2640' : '#4a4066')); if (!pine && k > th * 0.55 && k < th) { } } if (!pine) R(xx, wt0 - Math.round(th * 0.45), 1, Math.round(th * 0.45), '#2e2640'); } }
  }

  roofP(cx, ey, hw, h) {
    const R = this.B, q = this.q, top = ey - h, rw = Math.round(hw * 0.36), tip = Math.max(2, q(5));
    const halfAt = k => Math.round(rw + (hw - rw) * Math.pow(k / Math.max(1, h - 1), 0.8));
    for (let k = 0; k < h; k++) { const half = halfAt(k), yy = top + k; for (let xx = -half; xx <= half; xx++) { const m = ((xx % 3) + 3) % 3; R(cx + xx, yy, 1, 1, k === h - 1 ? (m === 0 ? '#9a92a6' : m === 1 ? '#22202c' : '#14101a') : k % 3 === 0 ? (m === 0 ? '#3a3442' : '#1e1a26') : m === 0 ? (k % 3 === 1 ? '#6a6278' : '#504858') : m === 1 ? '#3a3442' : '#2a2632'); } }
    for (const sd of [-1, 1]) for (let i = 1; i <= tip; i++) { const xx = cx + sd * (hw + i), yy = ey - 1 - Math.round(i * i / tip * 0.8); R(xx, yy, 1, 2, '#2c2834'); if (i === tip) { R(xx, yy - 1, 1, 1, '#2c2834'); R(xx, yy + 2, 1, 1, '#8a6a20'); R(xx, yy + 3, 1, 1, '#f0c850'); } }
    R(cx - hw, ey, 2 * hw + 1, 1, '#140e12');
    for (let xx = -hw + 1; xx <= hw - 1; xx++) { const bv = this.bay(cx + xx, 7); if (bv < 0.42) { const L = 1 + Math.floor(this.bay(xx, 3) * q(3.2)); R(cx + xx, ey + 1, 1, L, '#cfdcee'); R(cx + xx, ey + L, 1, 1, '#ffffff'); } }
    for (let xx = -hw; xx <= hw; xx++) { const ax = Math.abs(xx), k0 = ax <= rw ? 0 : Math.round(Math.pow((ax - rw) / Math.max(1, hw - rw), 1 / 0.8) * (h - 1)), dep = Math.max(1, Math.round(h * 0.42 + Math.sin(xx * 0.55 + cx) * q(1.2) + Math.sin(xx * 0.17) * q(1.5)));
      for (let k = k0; k < Math.min(h - 1, k0 + dep); k++) R(cx + xx, top + k, 1, 1, k === k0 + dep - 1 ? '#d6ccd8' : '#fbf7f6'); }
    const rh = Math.max(2, q(3)); R(cx - rw - 1, top - rh, 2 * rw + 3, rh, '#2a2430'); R(cx - rw - 1, top - rh - 1, 2 * rw + 3, Math.max(1, q(1.5)), '#fbf7f6');
    for (const sd of [-1, 1]) { const ex = cx + sd * (rw + 1) - (sd > 0 ? 1 : 0); R(ex, top - rh - q(3), 2, q(3), '#2a2430'); R(ex - sd, top - rh - q(4), 2, q(1.5), '#2a2430'); R(ex, top - rh - q(3) - 1, 2, 1, '#fbf7f6'); R(ex - sd, top - rh - q(2), 1, 1, '#e2b84a'); R(ex + sd, top - rh - q(1), 1, 1, '#e2b84a'); }
  }
  hall(cx, by, w, bh, rh, tiers, name) {
    const R = this.B, q = this.q, r = this.r; cx = Math.round(cx); w = Math.round(w);
    let top = by - bh; const bw0 = Math.round(w * 0.74);
    const body = (bw, top, bh, nm, gr) => { const bx = Math.round(cx - bw / 2);
      for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) R(bx + xx, top + yy, 1, 1, yy / bh > 0.5 + this.bay(bx + xx, top + yy) * 0.4 ? '#8e2e20' : '#a8382a');
      const sh = Math.max(4, q(5)), n = gr ? 2 * Math.max(1, Math.round(bw / q(24) / 2)) + 1 : Math.max(3, Math.round(bw / q(18))), ww = bw / n, mid = (n - 1) / 2, lp = Math.max(3, q(6)), W = this.wins;
      for (let i = 0; i < n; i++) { const x0 = Math.round(bx + ww * i) + 2, x1 = Math.round(bx + ww * (i + 1)) - 2, wd = x1 - x0, wy = top + sh + 3;
        if (gr && i === mid) { const dh = bh - sh - 3; (this.doors = this.doors || []).push({ x: x0 + 0, y: top + sh + 3, w: wd, h: dh, ph: r() * 6 });
          for (let yy = 0; yy < dh; yy++) for (let xx = 0; xx < wd; xx++) { const fy = yy / dh, nz = this.bay(x0 + xx, wy + yy); R(x0 + xx, wy + yy, 1, 1, fy > 0.86 ? (yy % 3 === 0 ? '#6a3a22' : '#8a4a28') : fy < 0.4 ? (nz < 0.15 ? '#ffc870' : '#ffdf9c') : fy < 0.7 ? (nz < 0.2 ? '#f0a85a' : '#f8c474') : '#e8a860'); }
          const sx = x0 + Math.round(wd * 0.12), sw2 = Math.max(3, Math.round(wd * 0.17)), sy = wy + Math.round(dh * 0.14), sh2 = Math.round(dh * 0.36); R(sx, sy - 1, sw2, 1, '#6a3a22'); R(sx, sy + sh2, sw2, 1, '#6a3a22'); for (let yy = 0; yy < sh2; yy++) for (let xx = 0; xx < sw2; xx++) R(sx + xx, sy + yy, 1, 1, (yy % 4 === 1 || yy % 4 === 2) && xx % 3 !== 1 && xx > 0 && xx < sw2 - 1 ? '#3a2a28' : '#f6eede');
          const tx = x0 + Math.round(wd * 0.3), tw = Math.round(wd * 0.4), ty = wy + Math.round(dh * 0.6), tf = wy + Math.round(dh * 0.86);
          R(tx, ty, tw, 1, '#c88a54'); R(tx, ty + 1, tw, 2, '#7a4626'); R(tx + 1, ty + 3, 1, tf - ty - 3, '#4a2616'); R(tx + tw - 2, ty + 3, 1, tf - ty - 3, '#4a2616'); R(tx + 2, ty - 3, 2, 3, '#2f7f74'); R(tx + 2, ty - 4, 2, 1, '#5fb0a0'); R(tx + tw - 5, ty - 2, 3, 2, '#e8dcc0');
          for (const sd of [0, 1]) { const cx2 = sd ? tx + tw + 2 : tx - 4; R(cx2, ty - 1, 3, 1, '#a0643a'); R(cx2, ty, 3, 3, '#5a3018'); R(cx2, ty + 3, 1, tf - ty - 3, '#3a2010'); R(cx2 + 2, ty + 3, 1, tf - ty - 3, '#3a2010'); }
          const lx = x0 + Math.round(wd * 0.8); R(lx, wy, 1, 3, '#3a2a28'); R(lx - 1, wy + 3, 3, 4, '#ee6a3c'); R(lx, wy + 4, 1, 2, '#ffd890'); R(lx, wy + 7, 1, 2, '#d8283a');
          R(x0 - 1, wy - 1, wd + 2, 1, '#e2b84a'); R(x0 - 1, wy, 1, dh, '#5a1c10'); R(x0 + wd, wy, 1, dh, '#5a1c10');
          W.push({ x: x0 + wd / 2, y: wy + dh * 0.45, r: Math.max(wd, dh) * 1.15, ph: r() * 6, I: 0.42 }); continue; }
        const wh = Math.max(6, bh - sh - 3 - (gr ? lp + 2 : 3));
        for (let yy = 0; yy < wh; yy++) for (let xx = 0; xx < wd; xx++) { const grid = xx % 4 === 0 || yy % 4 === 0 || xx === wd - 1 || yy === wh - 1 || (xx + yy) % 9 === 0, d = Math.hypot((xx - wd / 2) / (wd / 2), (yy - wh / 2) / (wh / 2)); R(x0 + xx, wy + yy, 1, 1, grid ? '#7a2a1c' : d * 0.7 + this.bay(x0 + xx, wy + yy) * 0.45 < 0.7 ? '#ffd890' : '#f0a85a'); }
        R(x0 - 1, wy - 1, wd + 2, 1, '#e2b84a'); R(x0 - 1, wy + wh, wd + 2, 1, '#e2b84a'); R(x0 - 2, wy - 2, wd + 4, 1, '#5a1c10'); R(x0 - 2, wy - 1, 1, wh + 2, '#5a1c10'); R(x0 + wd + 1, wy - 1, 1, wh + 2, '#5a1c10');
        if (gr) { const py0 = wy + wh + 1; for (let yy = 0; yy < lp; yy++) for (let xx = -1; xx <= wd; xx++) R(x0 + xx, py0 + yy, 1, 1, yy === 0 ? '#c89a38' : xx === -1 || xx === wd || yy === lp - 1 || (xx % 5 === 2 && yy > 0 && yy < lp - 1) ? '#5a1c10' : yy % 3 === 1 ? '#8e2e20' : '#a8382a'); }
        else { R(x0 - 2, wy + wh + 1, wd + 4, 1, '#c8bcc4'); for (let xx = -1; xx <= wd; xx += 3) R(x0 + xx, wy + wh + 1, 1, 1, '#fbf7f6'); }
        W.push({ x: x0 + wd / 2, y: wy + wh / 2, r: Math.max(wd, wh) * 1.2, ph: r() * 6 }); }
      for (let i = 0; i <= n; i++) { const pxx = Math.round(bx + ww * i) - 1; R(pxx, top, 3, bh, '#8e2e20'); R(pxx, top, 1, bh, '#c4584a'); R(pxx + 2, top, 1, bh, '#5a1c10'); if (gr) { R(pxx - 1, top + bh - 2, 5, 2, '#cfc6d4'); R(pxx - 1, top + bh - 2, 5, 1, '#f4eef6'); if (i > 0 && i < n && i !== mid && i !== mid + 1) this.lants2.push({ x: pxx + 1, y: top + sh + 1, s: this.u * 0.8, ph: i * 1.3 + bw }); } }
            const cols = ['#2f7f74', '#e2b84a', '#2a5a9a', '#e2b84a'], cw = Math.max(2, q(3));
      for (let xx = 0; xx < bw; xx++) { const ci = Math.floor(xx / cw) % 4, dx = Math.abs((xx % cw) - cw / 2); for (let y = 0; y < sh; y++) { let col = cols[ci]; if (y === 0) col = '#1a1216'; else if (y === 1) col = ci === 0 || ci === 2 ? '#9ec8e8' : '#fff0b0'; else if (y === sh - 1) col = '#1a1216'; else if (dx + Math.abs(y - sh / 2) < cw * 0.42) col = ci % 2 ? '#7a2a1c' : '#f4ecd8'; R(bx + xx, top + y, 1, 1, col); } }
      for (let xx = 0; xx < bw; xx++) { R(bx + xx, top + sh, 1, 1, '#1a1216'); R(bx + xx, top + sh + 1, 1, 1, xx % 4 < 2 ? '#c89a38' : '#2a5a9a'); }
      if (nm) { const pw = Math.min(Math.round(bw * 0.24), q(30)), ph = Math.max(6, q(9)), px0 = Math.round(cx - pw / 2), py0 = top + sh + 1; R(px0 - 1, py0 - 1, pw + 2, ph + 2, '#e2b84a'); R(px0, py0, pw, ph, '#1e1412'); this.plaques.push({ x: cx, y: py0 + ph / 2, w: pw, h: ph, t: nm }); }
    };
    body(bw0, top, bh, name, true);
    { const pw = bw0 + q(12), pf = Math.max(6, q(8)), px0 = Math.round(cx - pw / 2), sw = Math.max(12, q(16)), ssh = Math.max(1, Math.floor(pf / 3));
      for (let yy = 0; yy < pf; yy++) for (let xx = 0; xx < pw; xx++) { const rowN = Math.floor(yy / Math.max(2, q(2.5))), jt = (xx + (rowN & 1) * 4) % 9 === 0; R(px0 + xx, by + yy, 1, 1, yy === 0 ? '#fbf7f6' : yy === 1 ? '#e4dcea' : yy % Math.max(2, q(2.5)) === 0 || jt ? '#9a90a4' : this.bay(px0 + xx, by + yy) < 0.2 ? '#c4bace' : '#d4cada'); }
      for (let k = 0; k < 3; k++) { const stw = sw + k * q(3), sx2 = Math.round(cx - stw / 2); for (let yy = 0; yy < ssh; yy++) for (let xx = 0; xx < stw; xx++) R(sx2 + xx, by + 1 + k * ssh + yy, 1, 1, yy === 0 ? '#fbf7f6' : xx === 0 || xx === stw - 1 ? '#8a8096' : yy === ssh - 1 ? '#a89eb4' : '#e4dcea'); }
      const rh2 = Math.max(3, q(3)); for (const sd of [-1, 1]) for (let xx = Math.round(sw / 2) + q(6); xx < pw / 2 - 1; xx++) { const X2 = cx + sd * xx; R(X2, by - rh2, 1, 1, '#fbf7f6'); R(X2, by - rh2 + 1, 1, 1, '#a89eb4'); if (xx % 5 === 0) R(X2, by - rh2, 1, rh2, xx % 10 === 0 ? '#d4cada' : '#c4bace'); } }
    for (let t = 0; t < tiers; t++) { const hw = Math.round(w * (0.58 - t * 0.14)), h = Math.round(rh * (1 - t * 0.14)); this.roofP(cx, top, hw, h); top -= Math.round(h * 0.86); if (t < tiers - 1) { const ub = Math.round(bh * 0.55); body(Math.round(w * 0.47), top - ub, ub, null, false); top -= ub; } }
    R(cx - 1, top - q(7), 2, q(7), '#c89a38'); R(cx - 2, top - q(4), 4, Math.max(2, q(2)), '#e2b84a'); R(cx - 1, top - q(9), 2, q(2), '#e2b84a');
  }
  bamboo(bx, wt) {
    const R = this.B, r = this.r, q = this.q; bx = Math.round(bx); const bw = Math.max(1, q(1.6)), nd = Math.max(4, q(9));
    for (let k = 0; k < 5; k++) { const sx = bx + (k - 2) * q(4) + Math.round(r() * 2), top = wt - q(48) + (k % 2) * q(12) + Math.round(r() * q(8)), lean = (k - 2) * 0.04;
      for (let yy = top; yy < wt; yy++) { const xx = Math.round(sx + (wt - yy) * lean); R(xx, yy, bw, 1, k % 2 ? '#4f7f68' : '#5f9078'); if ((wt - yy) % nd === 0) R(xx - 1, yy, bw + 2, 1, '#2f5a48'); }
      for (let l = 0; l < 6; l++) { const ly = top + l * q(6) + Math.round(r() * q(3)), lx = Math.round(sx + (wt - ly) * lean), dir = l % 2 ? 1 : -1, ll = q(6 + r() * 4);
        for (let i = 0; i < ll; i++) { const yy = ly + Math.round(i * 0.45); R(lx + dir * i, yy, 1, 1, '#3e7a5c'); if (i < ll - 1) R(lx + dir * i, yy + 1, 1, 1, '#2f6048'); if (i > 1 && i < ll - 2 && i % 2) R(lx + dir * i, yy - 1, 1, 1, '#fbf7f6'); } } }
  }
  buildMid() {
    const { FW, PW, M, gy, q, mob } = this, [c, x] = this.mk(FW, this.PH), R = this.B = this.painter(x); this.L1 = c; const r = this.r = this.rng(5);
    const wt = this.wallTop = gy - q(34); this.lants2 = [];
    this.bamboo(M + PW * 0.31, wt); this.bamboo(M + PW * 0.655, wt);
    const hw_ = (f, cap) => Math.min(PW * f, q(cap));
    const gx = Math.round(M + PW * (mob ? 0.8 : 0.74)), gr = q(14), gc = gy - Math.round(gr * 0.98), ring = Math.max(2, q(3)), WC = ['#cc5642', '#bb4633', '#a43928'];
    for (let yy = wt; yy < gy; yy++) { const f = (yy - wt) / (gy - wt); for (let xx = 0; xx < FW; xx++) { const d = Math.hypot(xx - gx, yy - gc); let col;
      if (d < gr) { if (yy > gc + gr * 0.3) col = this.bay(xx, yy) < 0.15 ? '#e8dee6' : '#fbf6f2'; else col = (yy - (gc - gr)) / (gr * 1.3) > this.bay(xx, yy) * 0.6 + 0.4 ? '#f6e2d0' : '#efd4c4'; }
      else if (d < gr + ring) col = d < gr + 1 ? '#8a3020' : (yy < gc ? '#e2d6ce' : '#cbbeb8');
      else col = WC[Math.max(0, Math.min(2, Math.floor(f * 2.3 + this.bay(xx, yy) - 0.6)))];
      R(xx, yy, 1, 1, col); } }
    { const bh2 = Math.max(3, q(4)), bw2 = Math.max(6, q(9)); let row = 0; for (let yy = wt + 2; yy < gy - 2; yy += bh2, row++) { for (let xx = 0; xx < FW; xx++) if (Math.hypot(xx - gx, yy - gc) > gr + ring + 1) R(xx, yy, 1, 1, '#8a2c20'); for (let xx = (row & 1) * (bw2 >> 1); xx < FW; xx += bw2) { if (Math.hypot(xx - gx, yy - gc) > gr + ring + 1) R(xx, yy + 1, 1, bh2 - 1, '#98321f'); } }
      for (let yy = wt + 1; yy < wt + q(4); yy++) for (let xx = 0; xx < FW; xx++) R(xx, yy, 1, 1, yy < wt + 3 ? '#6e2216' : '#a43928'); }
    for (let xx = q(10); xx < FW; xx += q(22)) { if (Math.abs(xx - gx) < gr + ring + 2) continue; R(xx, wt + q(4), 1, gy - wt - q(8), '#9a3424'); R(xx + 1, wt + q(4), 1, gy - wt - q(8), '#d6644e'); }
    const inG = (a, b) => Math.hypot(a - gx, b - gc) < gr - 1;
    const tr = (a, b, c2, d2, th) => this.pl((xa, ya, w, h, col) => { if (inG(xa, ya)) R(xa, ya, w, h, col); }, a, b, c2, d2, th, '#3a2a28');
    tr(gx - gr * 0.25, gc + gr * 0.6, gx - gr * 0.05, gc - gr * 0.2, Math.max(1, q(2))); tr(gx - gr * 0.05, gc - gr * 0.2, gx + gr * 0.4, gc - gr * 0.5, 1); tr(gx - gr * 0.12, gc + gr * 0.1, gx - gr * 0.55, gc - gr * 0.3, 1);
    for (let i = 0; i < 18; i++) { const a = Math.round(gx + (r() - 0.5) * gr * 1.3), b = Math.round(gc - gr * 0.65 + r() * gr * 0.8); if (inG(a, b)) { R(a, b, 1, 1, '#d8304a'); if (r() < 0.5 && inG(a + 1, b)) R(a + 1, b, 1, 1, '#e86a7a'); } }
    [0.285, 0.345].forEach(fx => { const wx = Math.round(M + PW * fx); if (Math.abs(wx - gx) < gr + q(14)) return; const sz = q(9), y0 = wt + q(7), x0 = wx - (sz >> 1);
      R(x0 - 2, y0 - 2, sz + 4, sz + 4, '#dcd0c8'); R(x0 - 2, y0 + sz + 1, sz + 4, 1, '#b8aaa4');
      for (let yy = 0; yy < sz; yy++) for (let xx = 0; xx < sz; xx++) { const lat = (xx + yy) % 3 === 0 || (xx - yy + 399) % 3 === 0 || xx === 0 || yy === 0 || xx === sz - 1 || yy === sz - 1, dd = Math.hypot(xx - sz / 2, yy - sz / 2) / (sz * 0.6); R(x0 + xx, y0 + yy, 1, 1, lat ? '#6a2418' : dd + this.bay(xx, yy) * 0.4 < 0.75 ? '#ffd890' : '#e8a45a'); }
      this.wins.push({ x: wx, y: y0 + sz / 2, r: sz, ph: r() * 6, I: 0.22 }); });
    { const pb = Math.max(2, q(3)), pt2 = gy - pb - q(6); for (let yy = pt2; yy < gy - pb; yy++) for (let xx = 0; xx < FW; xx++) { if (Math.hypot(xx - gx, yy - gc) < gr + ring + 1) continue; const row = Math.floor((yy - pt2) / 3), jt = (xx + (row & 1) * 5) % 10 === 0; R(xx, yy, 1, 1, yy === pt2 ? '#eadede' : (yy - pt2) % 3 === 0 ? '#9e8e98' : jt ? '#9e8e98' : this.bay(xx, yy) < 0.2 ? '#b8a8b0' : '#c6b8c0'); } }
    const ph0 = Math.max(2, q(3)); R(0, gy - ph0, FW, ph0, '#d8ccc4'); R(0, gy - ph0, FW, 1, '#ece2dc'); for (let xx = 0; xx < FW; xx += q(12)) if (!inG(xx, gy - 2)) R(xx, gy - ph0, 1, ph0, '#b8aca8');
    const ch = Math.max(3, q(4));
    for (let k = 0; k < ch; k++) for (let xx = 0; xx < FW; xx++) { const m = xx % 3; R(xx, wt - ch + k, 1, 1, k === ch - 1 ? (m === 0 ? '#6a6272' : '#1a1620') : m === 0 ? '#4c4452' : m === 1 ? '#3a3442' : '#2c2834'); }
    R(0, wt, FW, 1, '#1a1216');
    for (let xx = 0; xx < FW; xx++) { const sh = Math.max(1, Math.round(q(2.5) + Math.sin(xx * 0.3) * 0.8 + Math.sin(xx * 0.07 + 1) * q(1.2))); R(xx, wt - ch - sh + 1, 1, sh, '#fbf7f6'); if (this.bay(xx, 0) < 0.5) R(xx, wt - ch + 1, 1, 1, '#dcd2dc'); }
    for (let xx = 0; xx < FW; xx += 2 + Math.floor(r() * 5)) if (r() < 0.5) R(xx, wt + 1, 1, 1 + Math.floor(r() * 2), '#eef0f6');
    const pbH = Math.max(6, q(8));
    this.hall(M + PW * 0.12, gy - pbH, hw_(0.25, 150), q(50), q(28), 1, '蘅芜苑');
    this.hall(M + PW * 0.5, gy - pbH, hw_(0.28, 190), q(58), q(34), 2, '怡红院');
    this.hall(M + PW * 0.88, gy - pbH, hw_(0.25, 160), q(52), q(30), 1, '潇湘馆');
    this.lants = this.lants2;
    this.lants.push({ x: gx - gr - q(7), y: wt + 1, s: this.u * 1.15, ph: 4 }, { x: gx + gr + q(7), y: wt + 1, s: this.u * 1.15, ph: 5 });
  }
  rock(cx, base, sz) {
    const R = this.B; cx = Math.round(cx); base = Math.round(base);
    const E = [[0, -0.35, 0.75, 0.4], [-0.2, -0.8, 0.45, 0.4], [0.25, -1.05, 0.35, 0.35], [0.4, -0.65, 0.35, 0.3]], H = [[-0.1, -0.5, 0.1], [0.3, -0.85, 0.08], [-0.3, -0.85, 0.07]];
    const inside = (xx, yy) => E.some(([a, b, rx, ry]) => ((xx - a * sz) / (rx * sz)) ** 2 + ((yy - b * sz) / (ry * sz)) ** 2 <= 1);
    for (let xx = -sz; xx <= sz; xx++) { let n = 0; for (let yy = -Math.round(sz * 1.45); yy <= 0; yy++) { if (!inside(xx, yy)) continue; let col = xx < -sz * 0.2 ? '#c8c0cc' : xx < sz * 0.25 ? '#aca4b4' : '#8e8698'; if (xx > sz * 0.25 && this.bay(xx + 99, yy + 99) < 0.3) col = '#aca4b4'; if (H.some(([a, b, rr]) => Math.hypot(xx - a * sz, yy - b * sz) < rr * sz)) col = '#5e5668'; if (n < 2) col = '#fbf7f6'; n++; R(cx + xx, base + yy, 1, 1, col); } }
  }
  buildGround() {
    const { FW, PH, PW, M, gy, q } = this, [c, x] = this.mk(FW, PH), R = this.B = this.painter(x); this.L2 = c; const r = this.rng(12);
    const [gc, gx] = this.mk(FW, PH - gy); this.gradImg(gx, FW, PH - gy, ['#fdfaf6', '#f6f0f0', '#ece4ea', '#e0d6e0', '#d4c8d6'], 0.25); x.drawImage(gc, 0, gy);
    for (let yy = gy + 2; yy < PH; yy++) { const f = (yy - gy) / (PH - gy); for (let xx = 0; xx < FW; xx++) { const v = this.vn(xx * 0.012, yy * (0.05 + f * 0.03)) * 0.65 + this.vn(xx * 0.05, yy * 0.14) * 0.35; if (v > 0.6) R(xx, yy, 1, 1, 'rgba(255,255,255,' + Math.min(0.55, (v - 0.6) * 2.6) + ')'); else if (v < 0.4) R(xx, yy, 1, 1, 'rgba(140,118,186,' + Math.min(0.2, (0.4 - v) * 0.8) + ')'); } }
    { const drift = (cx, cy, w, h) => { for (let yy = 0; yy < h; yy++) { const hw = Math.round(w * Math.sqrt(1 - ((h - 1 - yy) / h) ** 2)); for (let xx = -hw; xx <= hw; xx++) R(cx + xx, cy + yy - h, 1, 1, yy === 0 ? '#ffffff' : yy > h * 0.7 || xx > hw * 0.5 ? '#cfc4de' : this.bay(cx + xx, cy + yy) < 0.3 ? '#f2ecf6' : '#fbf8fc'); } };
      for (let i = 0; i < 14; i++) drift(M + Math.floor(r() * PW), gy + q(4 + r() * 9), q(10 + r() * 22), Math.max(2, q(2 + r() * 2)));
      const slant = (cx, by) => { const U2 = Math.max(2, q(1.8)); const bw = U2 * 8, sx = cx - (bw >> 1); R(sx, by - U2 * 2, bw, U2 * 2, '#8e8698'); R(sx, by - U2 * 2, bw, 1, '#d6cedc'); R(sx + U2, by - U2 * 6, bw - U2 * 2, U2 * 4, '#a69eb2'); R(sx + U2, by - U2 * 6, 1, U2 * 4, '#cfc6d6'); R(sx + U2 * 2, by - U2 * 12, U2 * 4, U2 * 6, '#b2aabe'); for (let yy = 0; yy < U2 * 4; yy++) for (let xx = 0; xx < U2 * 2; xx++) R(cx - U2 + xx, by - U2 * 11 + yy, 1, 1, yy % 3 === 0 ? '#ffb858' : '#ffd890'); R(sx, by - U2 * 14, bw, U2 * 2, '#8e8698'); R(sx - U2, by - U2 * 15, bw + U2 * 2, U2 * 2, '#a69eb2'); R(sx - U2, by - U2 * 16, bw + U2 * 2, U2, '#ffffff'); R(cx - U2, by - U2 * 18, U2 * 2, U2 * 2, '#cfc6d6'); R(cx - U2, by - U2 * 19, U2 * 2, U2, '#ffffff'); };
      slant(M + Math.round(PW * 0.4), gy + q(30)); slant(M + Math.round(PW * 0.6), gy + q(30));
      const shrub = (cx, by, rr) => { for (let yy = -rr; yy <= 0; yy++) for (let xx = -rr; xx <= rr; xx++) if (xx * xx + yy * yy * 1.4 <= rr * rr) { const l = (-yy / rr) * 0.8 + (this.bay(cx + xx, by + yy) - 0.5) * 0.6; R(cx + xx, by + yy, 1, 1, yy < -rr * 0.55 && this.bay(cx + xx, yy) < 0.7 ? '#ffffff' : l > 0.4 ? '#4c7a5c' : l > 0.1 ? '#35604a' : '#244a3a'); } };
      shrub(M + Math.round(PW * 0.335), gy + q(14), q(11)); shrub(M + Math.round(PW * 0.675), gy + q(14), q(11)); shrub(M + Math.round(PW * 0.045), gy + q(15), q(11));
      for (let i = 0; i < 16; i++) { const fx = M + Math.round(PW * 0.2) + i * q(6), fy = gy + q(62) + Math.round(Math.sin(i * 0.5) * q(2)) + (i & 1) * 2; R(fx, fy, 2, 1, '#c2b6d2'); R(fx, fy + 1, 1, 1, '#d8cee4'); } }
    this.rock(M + PW * 0.27, gy + q(12), q(18)); this.rock(M + PW * 0.95, gy + q(16), q(15));
  }
  flower(R, x, y, big) { const P = big ? '#d8283e' : '#e8607a'; R(x - 1, y, 3, 1, P); R(x, y - 1, 1, 3, P); if (big) { R(x - 2, y, 1, 1, P); R(x + 2, y, 1, 1, P); R(x, y - 2, 1, 1, P); R(x, y + 2, 1, 1, P); R(x - 1, y - 1, 1, 1, '#9a1830'); R(x + 1, y + 1, 1, 1, '#9a1830'); R(x + 1, y - 1, 1, 1, P); R(x - 1, y + 1, 1, 1, P); } R(x, y, 1, 1, '#f6d060'); }
  br(r, px, py, ang, len, th, d) {
    const nx = px + Math.cos(ang) * len, ny = py + Math.sin(ang) * len; this.segs.push([px, py, nx, ny, Math.max(1, Math.round(th))]);
    if (d <= 2 && r() < 0.8) this.flw.push([Math.round((px + nx) / 2 + (r() - 0.5) * 3), Math.round((py + ny) / 2 - 1), r() < 0.5]);
    if (d <= 0) { this.flw.push([Math.round(nx), Math.round(ny), 1], [Math.round(nx - 3), Math.round(ny + 2), 0]); return; }
    const n = d > 2 ? 2 : 3; for (let i = 0; i < n; i++) this.br(r, nx, ny, ang + (r() - 0.5) * 1.3 + 0.08, len * (0.62 + r() * 0.2), Math.max(1, th * 0.66), d - 1);
  }
  buildPlum() {
    const { FW, PH, PW, M, q, mob } = this, [c, x] = this.mk(FW, PH), R = this.painter(x); this.L3 = c; const r = this.rng(31); this.segs = []; this.flw = [];
    const s0 = M + PW + 4;
    if (mob) this.br(r, s0, PH * 0.26, Math.PI + 0.15, q(40), Math.max(2, q(5)), 4);
    else { this.br(r, s0, PH * 0.34, Math.PI + 0.12, q(58), Math.max(3, q(7)), 5); this.br(r, s0, PH * 0.05, Math.PI - 0.5, q(50), Math.max(2, q(6)), 4); }
    for (const [x0, y0, x1, y1, th] of this.segs) this.pl(R, x0, y0, x1, y1, th, '#2a1b1a');
    for (const [x0, y0, x1, y1, th] of this.segs) if (th >= 2) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let i = 0; i <= n; i++) { const a = i / n; R(x0 + (x1 - x0) * a - (th - 1) / 2, y0 + (y1 - y0) * a - (th - 1) / 2, th, Math.max(1, th >> 1), '#fbf7f6'); } }
    for (const [a, b, big] of this.flw) this.flower(R, a, b, big);
  }
  buildGrade() {
    const { PW, PH, gy, q } = this, mk = () => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; return [c, c.getContext('2d')]; };
    let [v, x] = mk(); let g = x.createRadialGradient(PW * 0.5, PH * 0.55, PH * 0.35, PW * 0.5, PH * 0.55, Math.hypot(PW, PH) * 0.62); g.addColorStop(0, 'rgba(40,24,64,0)'); g.addColorStop(1, 'rgba(60,36,70,0.3)'); x.fillStyle = g; x.fillRect(0, 0, PW, PH); this.gV = v;
    [v, x] = mk(); g = x.createLinearGradient(0, this.wallTop - q(6), 0, gy); g.addColorStop(0, 'rgba(236,196,200,0)'); g.addColorStop(1, 'rgba(236,196,204,0.34)'); x.fillStyle = g; x.fillRect(0, this.wallTop - q(6), PW + 40, gy - this.wallTop + q(6)); this.gM = v;
    [v, x] = mk(); g = x.createLinearGradient(0, gy, 0, PH); g.addColorStop(0, 'rgba(110,84,150,0)'); g.addColorStop(1, 'rgba(110,84,150,0.16)'); x.fillStyle = g; x.fillRect(0, gy, PW + 40, PH - gy); this.gS = v;
    [v, x] = mk(); { const R2 = this.painter(x), rr = this.rng(77); const st = (bx, h, lean) => { const w = Math.max(3, q(4)); for (let yy = 0; yy < h; yy++) { const xx = Math.round(bx + lean * yy / h * q(14)); R2(xx, PH - yy, w, 1, yy % q(20) < 2 ? '#0e0a18' : '#1e1832'); R2(xx, PH - yy, 1, 1, '#38305a'); } for (let n = 0; n < 7; n++) { const ly = Math.round(h * (0.35 + n * 0.09)), lx = Math.round(bx + lean * ly / h * q(14)), dir = n & 1 ? 1 : -1, ll = q(14 + rr() * 10); for (let i = 0; i < ll; i++) { const yy = PH - ly + Math.round(i * 0.5); R2(lx + dir * i, yy, 1, 2, '#161028'); if (i % 3 === 0) R2(lx + dir * i, yy - 1, 1, 1, '#4a4272'); } } }; } this.gF = v;
    [v, x] = mk(); g = x.createLinearGradient(0, 0, 0, gy * 0.55); g.addColorStop(0, 'rgba(90,64,130,0.2)'); g.addColorStop(1, 'rgba(70,52,110,0)'); x.fillStyle = g; x.fillRect(0, 0, PW + 40, gy * 0.55); this.gT = v;
  }
  buildFx() {
    const { PW, PH, mob, u } = this, r = this.rng(9), n = Math.round(PW * PH / (mob ? 900 : 520));
    this.flakes = Array.from({ length: n }, (_, i) => ({ l: i % 10 < 7 ? 0 : 1, x: r() * PW, y: r() * PH, v: (i % 10 < 7 ? 12 : 22) * u * (0.8 + r() * 0.4), ph: r() * 6 }));
    this.petals = Array.from({ length: mob ? 5 : 10 }, () => this.newPetal(true));
  }
  newPetal(any) { const { PW, PH } = this, r = Math.random; return { x: PW * (0.6 + r() * 0.45), y: any ? r() * PH : -4, ph: r() * 6, v: (8 + r() * 8) * this.u, c: r() < 0.5 ? '#c8283a' : '#e86a7a' }; }

  P(kind, dx, row, pal, o) { return Object.assign({ kind, dx, row, rb: pal[0], rl: pal[1], rd: pal[2], tr: '#f4ecd8', ph: Math.random() * 6 }, o || {}); }
  buildCrowd() {
    const { PW, mob } = this, P = this.P.bind(this);
    const cream = ['#e8dcc8', '#f8f0e2', '#b8a88e'], gold = ['#dcae4a', '#f0cc78', '#a07a22'], blue = ['#5a7ec0', '#86a4dc', '#38568e'], mred = ['#c8584a', '#e07c6c', '#8c342a'], brown = ['#8a5a3a', '#b07e58', '#5c3620'], feng = ['#d83c30', '#f26a58', '#921e18'], baoIn = ['#f0dca4', '#fcefc4', '#c8a862'];
    const CL = { bao: ['#cc2c3c', '#e85a5a', '#8c1626'], dai: ['#f0ebe4', '#ffffff', '#bcb4b0'], chai: ['#e2b04a', '#f4d07a', '#a67c22'], yun: ['#6c8cd0', '#98b2e8', '#4562a8'] };
    this.groups = [{ x: PW * (mob ? 0.5 : 0.36) }, { x: PW * 0.64 }];
    let L = [
      [0, P('bao', 0, 2, baoIn, { face: 1, cloak: CL.bao, sc: 1.1, nm: '宝玉', tr: '#e2b84a', prop: 'plum' })],
      [0, P('girl', -0.22, 2, cream, { face: 1, cloak: CL.dai, pin: '#c8e0dc', nm: '黛玉', prop: 'hoe' })],
      [0, P('girl', -0.42, 1, gold, { face: 1, cloak: CL.chai, pin: '#e8584c', nm: '宝钗', prop: 'fan', lock: 1 })],
      [0, P('girl', -0.62, 2, blue, { face: 1, cloak: CL.yun, pin: '#e8c060', nm: '湘云', prop: 'snowball' })],
      [1, P('elder', 0, 1, brown, { face: -1, prop: 'cane', nm: '贾母', pv: 48 })],
      [1, P('maid', 0.16, 1, mred, { face: -1, prop: 'umb', umb: -0.16, nm: '鸳鸯', pv: 48 })],
      [1, P('girl', -0.24, 2, feng, { face: 1, pin: '#e2b84a', tr: '#e2b84a', nm: '凤姐', prop: 'warmer' })]
    ];
    if (mob) L = L.filter(a => a[0] === 0).slice(0, 3).concat(L.filter(a => a[0] === 1).slice(0, 2));
    this.crowd = L.map(([g, p]) => { p.g = g; return p; });
  }
  // 性格：宝玉坐不住，在姐妹间来回凑；黛玉多半静立出神；宝钗端稳少动；湘云跑跳；凤姐站着说笑
  persona(p) {
    return ({ 宝玉: { rng: [-0.75, 0.25], spd: 0.16, idle: [1.2, 2.6] }, 黛玉: { rng: [-0.32, -0.12], spd: 0.035, idle: [7, 12] }, 宝钗: { rng: [-0.5, -0.36], spd: 0.06, idle: [5, 8] }, 湘云: { rng: [-0.95, 0.3], spd: 0.2, idle: [0.6, 1.8], hop: 1 }, 凤姐: { rng: [-0.3, -0.16], spd: 0.08, idle: [3, 6] } })[p.nm];
  }
  U() { return this.PH * this.S * 0.75; }
  stepCrowd(dt) {
    const U = this.U();
    for (const p of this.crowd) {
      const P = this.persona(p); p.k = p.k || 0; if (p.ox == null) p.ox = 0;
      if (!P) continue;
      if (p.tx == null) { p.tx = p.dx; p.it = P.idle[0] * Math.random(); }
      { const gx = this.groups[p.g].x, lo = (0.06 * this.PW - gx) / U, hi = (0.94 * this.PW - gx) / U; p.tx = Math.max(lo, Math.min(hi, p.tx)); }
      const cur = p.dx + p.ox, d = p.tx - cur;
      if (Math.abs(d) > 0.01) { p.ox += Math.sign(d) * Math.min(Math.abs(d), P.spd * dt); p.face = Math.sign(d); p.k += (1 - p.k) * Math.min(1, dt * 5); }
      else {
        p.k += (0 - p.k) * Math.min(1, dt * 4); p.it -= dt;
        if (p.nm === '宝玉' && p.near) { const o = this.crowd.find(c => c.nm === p.near); if (o) p.face = Math.sign((o.dx + o.ox) - cur) || 1; }
        if (p.it <= 0) {
          p.it = P.idle[0] + Math.random() * (P.idle[1] - P.idle[0]);
          if (p.nm === '宝玉') { const sis = this.crowd.filter(c => c.g === p.g && c !== p); if (sis.length) { const o = (Math.random() < 0.5 && sis.find(c => c.nm === '黛玉')) || sis[Math.floor(Math.random() * sis.length)], oc = o.dx + (o.ox || 0), side = oc > cur ? -1 : 1; p.tx = Math.max(P.rng[0], Math.min(P.rng[1], oc + side * 0.13)); p.near = o.nm; } }
          else { p.tx = P.rng[0] + Math.random() * (P.rng[1] - P.rng[0]); if (p.nm === '黛玉' && Math.random() < 0.5) p.tx = cur; }
        }
      }
    }
  }
  pos(p) { const gr = this.groups[p.g]; return [gr.x + (p.dx + (p.ox || 0)) * this.U(), this.gy + this.q([24, 52, 88][p.row]), this.u * [1.25, 1.4, 1.58][p.row] * (p.sc || 1)]; }

  fig(p, X, Yf, k) {
    const R = this.R, t = this.t, Q = v => Math.round(v * k), K = p.k || 0, ph = p.ph, P = this.persona(p) || {}, f = p.face || 1, pr = p.prop, paused = p.kind === 'bao' && K < 0.2;
    const ws = P.hop ? 6.5 : p.nm === '黛玉' ? 2.8 : 4.5, s = Math.sin(t * ws + ph) * K;
    const hop = P.hop ? Math.abs(Math.sin(t * ws * 0.5 + ph)) * K * 2 + (K < 0.2 && Math.sin(t * 1.3 + ph) > 0.9 ? 1.4 : 0) : 0;
    const bu = (Math.abs(s) > 0.6 ? 0.7 : 0) + hop - (p.nm === '黛玉' && Math.sin(t * 0.35 + ph) > 0.6 ? 0.7 : 0);
    const x0 = Math.round(X), yF = Math.round(Yf), Yu = v => yF - Math.round((v + bu) * k), ln = f * K * (p.nm === '黛玉' ? 0.3 : 1) * k;
    const cxAt = v => x0 + ln * Math.max(0, v - 4) / 22, Hd = (du, v) => [Math.round(cxAt(v) + f * du * k), Yu(v)];
    const hair = p.kind === 'elder' ? '#e8e6ee' : '#1c1416', skin = '#f6e0ca', skinD = '#e6c4aa', sl = p.cloak ? p.cloak[2] : p.rd;
    const sw = Q(5.8); for (let xx = -sw; xx <= sw; xx++) if (Math.abs(xx) < sw * 0.7 || (xx & 1)) R(x0 + xx, yF + 1, 1, 1, '#cfc2d2');
    [-1, 1].forEach(kk => { const a = t * ws + ph + (kk > 0 ? Math.PI : 0), dx = Math.round(Math.sin(a) * K * 1.6 * k), up = Math.cos(a) * K > 0.5 ? 1 : 0; R(x0 + Math.round(kk * 1.8 * k) + dx - Q(0.8) + (f > 0 ? 1 : 0), yF - Math.round(hop * k) - up, Math.max(2, Q(2)), Math.max(1, Q(1)), '#2a1c1e'); });
    const body = (v0, v1, hwF, pal, trim, trimTo, flare) => {
      for (let yy = Yu(v1); yy <= Yu(v0); yy++) { const v = (yF - yy) / k - bu, hw = hwF(v); if (hw <= 0) continue;
        const cx = cxAt(v) + (flare && v < 16 ? s * 1.2 * k * (1 - v / 16) : 0), a = Math.round(cx - hw * k), b = Math.round(cx + hw * k);
        for (let xx = a; xx <= b; xx++) { const fr = (xx - a) / Math.max(1, b - a); let col = pal[0];
          if (v < trimTo) col = trim; else if (xx === a) col = pal[1]; else if (xx === b) col = this.mixc(pal[2], '#241420', 0.5); else if (fr > 0.82) col = pal[2]; else if (fr > 0.56 + (this.vn(xx * 0.45 + 3, yy * 0.3) - 0.5) * 0.16) col = this.mixc(pal[0], pal[2], 0.5); else if (fr < 0.22) col = this.mixc(pal[0], pal[1], 0.5);
          R(xx, yy, 1, 1, col); if (col === pal[0] && v < 21 && v > 3 && ((xx - a) * 2 + Math.floor(v * 0.45)) % 9 === 0 && fr > 0.18) R(xx, yy, 1, 1, 'rgba(50,20,40,0.2)'); else if (col === pal[0] && v < 3.2 && v > 1.4) R(xx, yy, 1, 1, 'rgba(50,20,40,0.22)'); } } };
    const arm = (front, h) => { const sx = Math.round(cxAt(23.5) + (front ? f : -f) * 2.6 * k), sy = Yu(23.5), th = Math.max(2, Q(1.6)); this.pl(R, sx, sy, h[0], h[1], th, sl); R(h[0] - (th >> 1), h[1] - (th >> 1), th, th, skin); };
    let fh = null, bh = null;
    if (pr === 'plum') fh = Hd(3.2 + (paused ? Math.sin(t * 6) * 0.9 : 0), paused ? 28 : 17 + s);
    else if (pr === 'hoe') fh = Hd(2.4, 18);
    else if (pr === 'fan') fh = Hd(3.4, 19.5 + Math.sin(t * 3 + ph) * 0.5);
    else if (pr === 'snowball') { const c2 = (t * 0.9 + ph) % 1; p._b = c2 < 0.25 ? 1 - c2 / 0.25 * 0.6 : c2 < 0.55 ? 0.4 : (c2 - 0.55) / 0.45 * 0.6 + 0.4; p._c = c2; fh = Hd(3, 17 + 7 * p._b); }
    else if (pr === 'warmer') { fh = Hd(2.2, 16); bh = Hd(-3.6, 20.5 + 1.3 * Math.sin(t * 3.2 + ph)); }
    else if (pr === 'umb') fh = Hd(3.2, 18);
    else if (pr === 'cane') fh = Hd(3.6, 16);
    if (!bh) bh = pr ? Hd(0.8, 15.5) : K > 0.2 ? Hd(-2.4 - s * 1.8, 14) : null;
    if (!fh && K > 0.2) fh = Hd(2.4 + s * 1.8, 14);
    if (bh) arm(false, bh);
    body(1, 25.2, v => v > 23.5 ? 3.3 - (v - 23.5) * 1.1 : 5.3 - Math.max(0, v - 3) * 0.09, [p.rb, p.rl, p.rd], p.tr, 2.3, true);
    if (p.cloak) { body(4.5, 26.6, v => v > 24.6 ? 3.8 - (v - 24.6) * 1.3 : 6.6 - (v - 4.5) * 0.13, p.cloak, '#fbf7f2', 6, true); body(24.4, 27.2, v => v > 26.4 ? 3.4 - (v - 26.4) * 2.5 : 3.5, ['#fbf7f2', '#ffffff', '#dcd2d8'], '#fbf7f2', 0, false); }
    else { body(14.6, 15.8, v => 5.5 - (v - 3) * 0.09, [p.tr, p.tr, p.tr], p.tr, 0, true); const cx = Math.round(cxAt(24)); R(cx - 1, Yu(25), 1, 1, p.tr); R(cx + 1, Yu(25), 1, 1, p.tr); R(cx, Yu(24), 1, 1, p.tr); }
    if (p.kind === 'bao') { const cx = Math.round(cxAt(20)); R(cx, Yu(22.5), 1, Q(2), '#c8283a'); R(cx, Yu(20.4), Math.max(1, Q(1)), Math.max(1, Q(1)), '#e2b84a'); R(cx, Yu(19.4), Math.max(1, Q(0.9)), Math.max(1, Q(0.9)), '#8ee0b8'); }
    if (p.lock) { const cx = Math.round(cxAt(21)); R(cx - Q(0.7), Yu(22), Math.max(2, Q(1.6)), Math.max(2, Q(1.3)), '#f0c040'); R(cx, Yu(21.6), 1, 1, '#a67c22'); }
    if (!fh && !bh) { const c0 = Hd(0.8, 16); R(c0[0] - Q(1.8), c0[1] - Q(1), Q(3.6), Math.max(2, Q(1.8)), sl); R(c0[0] - Q(1.8), c0[1] - Q(1), Q(3.6), 1, p.cloak ? p.cloak[1] : p.rl); }
    const hx = Math.round(cxAt(30) + f * 0.3 * k), hr = 3.5, hy = 30.6;
    R(hx - Q(0.9), Yu(27.6), Math.max(2, Q(1.8)), Q(1) + 1, skinD);
    for (let yy = Yu(hy + hr); yy <= Yu(hy - hr); yy++) { const dv = (yF - yy) / k - bu - hy, hw = Math.sqrt(Math.max(0, hr * hr - dv * dv)); if (hw < 0.5) continue; const a = Math.round(hx - hw * k), b = Math.round(hx + hw * k);
      for (let xx = a; xx <= b; xx++) { const back = f > 0 ? xx - a : b - xx; let col = back === 0 ? skinD : skin; if (dv > 0.7 || (dv > -1.8 && back < Math.max(1, 1.2 * k))) col = hair; else if (dv < -2.1 && dv > -3.3) col = skinD; R(xx, yy, 1, 1, col); } }
    const ex = hx + f * Math.max(1, Q(0.9)), ey = Yu(30.1), gap = Math.max(1, Q(1.3)), blink = (t * 0.6 + ph) % 3.7 < 0.12;
    if (!blink) { const eh = k > 1.1 ? 2 : 1; R(ex - gap, ey - eh + 1, 1, eh, '#2a1a1a'); R(ex + gap, ey - eh + 1, 1, eh, '#2a1a1a'); if (k > 1.1) { R(ex - gap, ey - 2, 1, 1, p.kind === 'elder' ? '#b8b4c0' : '#3a2428'); R(ex + gap, ey - 2, 1, 1, p.kind === 'elder' ? '#b8b4c0' : '#3a2428'); } } else { R(ex - gap, ey, 1, 1, '#4a2a2a'); R(ex + gap, ey, 1, 1, '#4a2a2a'); }
    R(ex - gap - 1, Yu(29.2), 1, 1, '#f2a8a0'); R(ex + gap + 1, Yu(29.2), 1, 1, '#f2a8a0'); R(ex, Yu(28.4), 1, 1, '#c8584a');
    const blob = (cx, cy, rr, col) => { rr = Math.max(1, rr); for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr; xx <= rr; xx++) if (xx * xx + yy * yy <= rr * rr + rr * 0.8) R(cx + xx, cy + yy, 1, 1, col); };
    if (p.kind === 'bao') { blob(hx, Yu(35.2), Q(1.2), hair); R(hx - Q(1.6), Yu(36.4), Q(3.2) + 1, Math.max(2, Q(1.5)), '#e6b840'); R(hx - Q(1.6), Yu(36.4), 1, 1, '#fff0a8'); R(hx, Yu(37.2), 1, 1, '#d8283a'); R(hx - Q(3.4), Yu(32.4), Q(6.8) + 1, Math.max(1, Q(0.8)), '#c8283a'); R(hx + f * Q(0.4), Yu(32.4), 1, 1, '#f0d060'); }
    else if (p.kind === 'elder') { blob(hx, Yu(34.9), Q(1.5), hair); R(hx - Q(3.5), Yu(32.2), Q(7) + 1, Math.max(1, Q(0.9)), '#5a3a2a'); R(hx, Yu(32.2), 1, 1, '#7ac0a0'); }
    else { const bs = Q(p.kind === 'maid' ? 1.1 : 1.4), pc = p.kind === 'maid' ? '#d8304a' : p.pin; [-1, 1].forEach(sd => { const bx = hx + sd * Q(2.7), by = Yu(34.1); blob(bx, by, bs, hair); R(bx, by - bs, 1, 1, pc); }); if (p.nm === '黛玉' || p.nm === '宝钗' || p.nm === '凤姐') { const tx = hx - f * Q(2.7); R(tx, Yu(33.2), 1, Q(2.2), pc); R(tx, Yu(31), 1, 1, '#e2b84a'); } }
    if (fh) arm(true, fh);
    if (pr === 'plum') { const sw2 = Math.round(Math.sin(t * (paused ? 6 : 3) + ph) * 1.2 * k), tx = fh[0] + f * Q(3) + sw2, ty = fh[1] - Q(13), mx = Math.round((fh[0] + tx) / 2), my = Math.round((fh[1] + ty) / 2), qx = Math.round(fh[0] + (tx - fh[0]) * 0.25), qy = Math.round(fh[1] + (ty - fh[1]) * 0.25), b1 = [mx + f * Q(3.5) + sw2, my - Q(2.5)], b2 = [qx - f * Q(2), qy - Q(3)];
      this.pl(R, fh[0], fh[1], tx, ty, Math.max(1, Q(0.8)), '#3a2220'); this.pl(R, mx, my, b1[0], b1[1], 1, '#3a2220'); this.pl(R, qx, qy, b2[0], b2[1], 1, '#3a2220');
      [[tx, ty, 1], [b1[0], b1[1], 1], [b2[0], b2[1], 0], [mx, my, 0], [tx - f * Q(1), ty + Q(3), 0]].forEach(([a, b, g]) => this.flower(R, a, b, g && k > 1.1));
      for (let j = 0; j < 3; j++) { const q3 = (t * 0.6 + j / 3) % 1; R(tx + Math.round(Math.sin(q3 * 7 + j * 2) * 2 * k), ty + Math.round(q3 * 22 * k), 1, 1, '#d8304a'); } }
    else if (pr === 'hoe') { const e = Hd(-4.6, 37 + s * 0.3), st = [fh[0] + f * Q(1.2), fh[1] + Q(3)], bw = Q(2.4); this.pl(R, st[0], st[1], e[0], e[1], Math.max(1, Q(0.8)), '#7a5230'); R(e[0] - (f > 0 ? bw : 0), e[1], bw + 1, Math.max(2, Q(1.6)), '#6a7078'); R(e[0] - (f > 0 ? bw : 0), e[1], bw + 1, 1, '#a8b0b8');
      const bx = Math.round(e[0] + (st[0] - e[0]) * 0.3), by = Math.round(e[1] + (st[1] - e[1]) * 0.3); R(bx, by, 1, Q(2), '#8a5a3a'); R(bx - Q(1), by + Q(2), Math.max(2, Q(2.2)), Math.max(3, Q(2.8)), '#f0a0b8'); R(bx - Q(1), by + Q(2), 1, Math.max(3, Q(2.8)), '#b0506a'); R(bx, by + Q(2), 1, 1, '#e2b84a'); }
    else if (pr === 'fan') { const fc = [fh[0] + f * Q(0.8), fh[1] - Q(5.4)], rr = Math.max(2, Q(2.8)); this.pl(R, fh[0], fh[1], fc[0], fc[1] + rr, 1, '#8a5a2a');
      for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr; xx <= rr; xx++) { const d = Math.hypot(xx, yy); if (d > rr + 0.3) continue; R(fc[0] + xx, fc[1] + yy, 1, 1, d > rr - 0.8 ? '#c89a48' : '#fbf2e2'); }
      R(fc[0] - 1, fc[1] - 1, 1, 1, '#e88aa0'); R(fc[0] + 1, fc[1], 1, 1, '#8ac8f0'); R(fc[0] - 1, fc[1] + 1, 3, 1, '#6a9a6a');
      const bx = Math.round(fc[0] + f * 8 * k + Math.sin(t * 1.7) * 4 * k), by = Math.round(fc[1] - 6 * k + Math.sin(t * 2.3) * 3 * k), w = Math.sin(t * 12) > 0 ? 2 : 1; R(bx - w, by - 1, w, 2, '#f0a0d0'); R(bx + 1, by - 1, w, 2, '#8ac8f0'); R(bx - w + 1, by + 1, w, 1, '#e080b8'); R(bx, by - 1, 1, 3, '#2a1a2a'); }
    else if (pr === 'snowball') { const c2 = p._c || 0, up = c2 >= 0.25 && c2 < 0.55 ? Math.sin((c2 - 0.25) / 0.3 * Math.PI) * 10 : 0, rr = Math.max(2, Q(1.5)), bx = fh[0] + f * Q(0.4), by = fh[1] - rr - Math.round(up * k);
      for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr; xx <= rr; xx++) { const d2 = xx * xx + yy * yy; if (d2 <= rr * rr + rr * 0.6) R(bx + xx, by + yy, 1, 1, d2 > rr * rr - rr ? '#9a8cae' : xx + yy > 0 ? '#d6ccdc' : '#ffffff'); }
      if (up > 6) R(bx - f * Q(1.5), by + Q(2.5), 1, 1, '#ffffff'); }
    else if (pr === 'warmer') { const wx = fh[0] + f * Q(0.6), wy = fh[1] + Q(0.6), w = Math.max(3, Q(4)), h = Math.max(2, Q(2.8)), l = wx - (w >> 1), tp = wy - (h >> 1); this.blit(this.ctx, this.glow(Math.max(3, Q(7)), '#ff9a50'), wx, wy, 0.35); R(l, tp, w, h, '#d8a848'); R(l, tp, w, 1, '#f4d27a'); R(l, tp + h - 1, w, 1, '#8a6420'); for (let i = 1; i < w - 1; i += 2) R(l + i, tp + 1, 1, 1, '#7a5a20'); R(l + 1, tp - Math.max(1, Q(1.2)), w - 2, 1, '#8a6420'); }
    else if (pr === 'cane') { const tap = Math.sin(t * 1.3 + ph) > 0.7 ? 1 : 0; this.pl(R, fh[0], fh[1] - Q(1), fh[0] + f * Q(0.8), yF - tap, Math.max(1, Q(0.9)), '#5a3a1a'); R(fh[0] - Q(0.8), fh[1] - Q(2.4), Math.max(2, Q(1.8)), Math.max(2, Q(1.6)), '#e2b84a'); R(fh[0] - Q(0.8), fh[1] - Q(2.4), 1, 1, '#fff0a8'); }
    else if (pr === 'umb') { const ux = x0 + Math.round(p.umb * 0.55 * this.U()) + Math.round(Math.sin(t * 0.8 + ph) * 0.6 * k), ut = Yu(45), n = Math.max(4, Q(5.5)), RW = Q(15), rib = Math.max(3, Q(3));
      this.pl(R, fh[0], fh[1], ux, ut + 1, 1, '#5a3a1a');
      for (let i = 0; i <= n; i++) { const hw = Math.round(RW * Math.sqrt(1 - Math.pow((n - i) / n, 2))), yy = ut + i; for (let xx = -hw; xx <= hw; xx++) { const fr = (xx + hw) / Math.max(1, 2 * hw); let col = Math.abs(xx) % rib === 0 ? '#e8805a' : '#d24a30'; if (fr > 0.7 + (this.vn(xx * 0.4, yy * 0.5) - 0.5) * 0.14) col = '#a8321e'; if (i === n) col = (xx & 1) ? '#8a2418' : '#d24a30'; if (i < Math.max(1, n * 0.35) || (i < n * 0.5 && this.vn(xx * 0.3 + 50, yy * 0.6) < 0.5)) col = '#fbf7f6'; R(ux + xx, yy, 1, 1, col); } }
      R(ux, ut - 1, 1, 2, '#5a3a1a'); }
  }

  lantern(X, Y, s, ph) {
    const R = this.R, sw = Math.round(Math.sin(this.t * 1.2 + ph) * s * 0.8), L = Math.max(2, Math.round(s * 3)), cx = X + sw, top = Y + L, hgt = Math.max(4, Math.round(6 * s)), cap = Math.round(1.5 * s);
    for (let i = 0; i < L; i++) R(X + Math.round(sw * i / L), Y + i, 1, 1, '#2a2022');
    this.blit(this.ctx, this.glow(Math.round(s * 9), '#ff9a50'), cx, top + hgt / 2, 0.32 * (0.85 + 0.15 * Math.sin(this.t * 7 + ph * 3)));
    R(cx - cap, top, 2 * cap + 1, Math.max(1, Math.round(s)), '#e2b84a');
    for (let yy = 0; yy < hgt; yy++) { const hw = Math.round((yy < hgt * 0.2 || yy > hgt * 0.8 ? 2 : 3) * s * 0.9); for (let xx = -hw; xx <= hw; xx++) { const a = Math.abs(xx) / Math.max(1, hw); R(cx + xx, top + 1 + yy, 1, 1, a < 0.3 ? '#ffd890' : a < 0.7 ? '#ee6a3c' : '#b82a26'); } }
    R(cx - cap, top + hgt + 1, 2 * cap + 1, Math.max(1, Math.round(s)), '#e2b84a');
    R(cx, top + hgt + 2, 1, Math.max(2, Math.round(2.5 * s)), '#d8283a');
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.acc += dt; this.last = now; if (this.acc < 1 / 30 - 0.002) return;
    const step = this.acc * (this.props.speed ?? 1) * (this.reduce ? 0.3 : 1); this.acc = 0; this.t += step;
    const par = (this.props.parallax ?? true) && !this.mob; this.mx += ((par ? this.mt : 0) - this.mx) * 0.08;
    const { PW, PH, u } = this, sn = this.props.snow ?? 1;
    for (const f of this.flakes) { f.y += f.v * step * sn; f.x += (Math.sin(this.t * 0.8 + f.ph) * 3 - 2) * u * step * sn; if (f.y > PH + 2) { f.y = -2; f.x = Math.random() * (PW + 20); } if (f.x < -3) f.x += PW + 6; }
    for (const p of this.petals) { p.y += p.v * step; p.x += (Math.sin(this.t * 1.1 + p.ph) * 5 - 4) * u * step; if (p.y > PH + 3 || p.x < -4) Object.assign(p, this.newPetal(false)); }
    this.stepCrowd(step); this.draw();
  }
  bloom(a) {
    const { ctx: c, PW, PH } = this, w = Math.max(8, PW >> 2), h = Math.max(8, PH >> 2);
    if (!this.bc) { this.bc = document.createElement('canvas'); this.bc.width = w; this.bc.height = h; this.bx = this.bc.getContext('2d'); }
    const b = this.bx; b.globalCompositeOperation = 'copy'; b.filter = 'brightness(0.55) contrast(3) saturate(1.3) blur(1px)'; b.imageSmoothingEnabled = true; b.drawImage(c.canvas, 0, 0, w, h); b.filter = 'none';
    c.save(); c.imageSmoothingEnabled = true; c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.drawImage(this.bc, 0, 0, PW, PH); c.restore(); c.imageSmoothingEnabled = false;
  }
  sparkle(ox) {
    const { R, gy, PW, PH, t } = this; for (let i = 0; i < 70; i++) { const h1 = Math.abs(Math.sin(i * 91.7) * 4375.5) % 1, h2 = Math.abs(Math.sin(i * 37.3 + 5) * 9183.1) % 1, x = Math.round(ox + h1 * PW), y = Math.round(gy + 4 + h2 * (PH - gy - 6)), s = Math.sin(t * 2.2 + i * 3.7); if (s > 0.9) { R(x, y, 1, 1, '#ffffff'); if (s > 0.97) { R(x - 1, y, 3, 1, '#fff6ff'); R(x, y - 1, 1, 3, '#fff6ff'); } } }
    const f = [[0.12, 0.74], [0.16, 0.77], [0.2, 0.795], [0.25, 0.8], [0.3, 0.83], [0.36, 0.84], [0.41, 0.86], [0.47, 0.87]]; f.forEach(([a, b], i) => { const x = Math.round(ox + PW * a), y = Math.round(gy + (PH - gy) * (b - 0.62) / 0.38 * 0.9 + 6), d = i & 1 ? 2 : -2; R(x + d, y, 3, 1, '#b8aad0'); R(x + d, y + 1, 3, 1, '#d8ccea'); R(x + d + 1, y - 1, 1, 1, '#f4eef8'); });
  }
  fore(ox) {
    const { ctx: c, R, q, gy, PW, t } = this, disc = (cx, cy, r, f) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + r * 0.6) R(cx + xx, cy + yy, 1, 1, f(xx / r, yy / r, xx, yy)); };
    const sw = (a, b) => (a * 0.7 - b * 0.8 + (this.vn(a * 3 + 9, b * 3 + 9) - 0.5) * 0.35);
    { const sx = Math.round(ox + PW * 0.07), sb = gy + q(92), r1 = q(11), r2 = q(8), r3 = q(6);
      for (let i = 0; i < r1 * 2; i++) { R(sx - r1 + i, sb, 1, 1, '#b8a8c8'); } 
      disc(sx, sb - r1, r1, (a, b) => { const l = sw(a, b); return l > 0.55 ? '#ffffff' : l > 0.1 ? '#f2ecf8' : l > -0.4 ? '#d8cce6' : '#b4a6cc'; });
      disc(sx, sb - r1 * 2 - r2 + 3, r2, (a, b) => { const l = sw(a, b); return l > 0.55 ? '#ffffff' : l > 0.1 ? '#f2ecf8' : l > -0.4 ? '#d8cce6' : '#b4a6cc'; });
      const hy = sb - r1 * 2 - r2 * 2 - r3 + 6; disc(sx, hy, r3, (a, b) => { const l = sw(a, b); return l > 0.55 ? '#ffffff' : l > 0.1 ? '#f2ecf8' : l > -0.4 ? '#d8cce6' : '#b4a6cc'; });
      R(sx - 3, hy - 2, 2, 2, '#1a1216'); R(sx + 2, hy - 2, 2, 2, '#1a1216'); R(sx, hy, 6, 2, '#ee7a2c'); R(sx, hy, 6, 1, '#ffb060'); for (let i = -2; i <= 2; i++) R(sx + i * 2, hy + 3 + Math.abs(i) % 2, 1, 1, '#1a1216');
      R(sx - r3, hy + r3 - 2, r3 * 2, 3, '#c8283a'); R(sx - r3, hy + r3 - 2, r3 * 2, 1, '#e86a7a'); R(sx + r3 - 3, hy + r3, 3, 5, '#a81c2c');
      R(sx - r3 - 1, hy - r3 - 1, r3 * 2 + 2, 2, '#1a1216'); R(sx - r3 + 2, hy - r3 - 7, r3 * 2 - 4, 7, '#1a1216'); R(sx - r3 + 2, hy - r3 - 3, r3 * 2 - 4, 2, '#c8283a');
      this.pl(R, sx - r2 + 1, sb - r1 * 2 - 1, sx - r1 - q(8), sb - r1 * 2 - q(9), 1, '#5a3a22'); this.pl(R, sx + r2 - 1, sb - r1 * 2 - 1, sx + r1 + q(8), sb - r1 * 2 - q(6), 1, '#5a3a22');
      for (let i = 0; i < 3; i++) R(sx - 1, sb - r1 * 2 - r2 + 6 + i * 4, 2, 2, '#1a1216'); }
    { const bx = Math.round(ox + PW * 0.9), bb = gy + q(84), bw = q(13), fl = Math.sin(t * 9) * 0.5 + Math.sin(t * 15.7) * 0.5;
      this.blit(c, this.glow(q(70), '#ff8a3c'), bx, bb - q(14), 0.5 + 0.1 * fl);
      for (const sd of [-1, 1, 0]) this.pl(R, bx + sd * bw * 0.55, bb - q(8), bx + sd * bw * 0.8, bb, 2, '#2a1c14');
      for (let yy = 0; yy < q(9); yy++) { const hw = Math.round(bw * (0.62 + 0.38 * Math.sin((yy / q(9)) * 1.5 + 0.2))); for (let xx = -hw; xx <= hw; xx++) R(bx + xx, bb - q(17) + yy, 1, 1, yy < 2 ? '#e8c06a' : xx < -hw * 0.4 ? '#a8742c' : xx > hw * 0.5 ? '#4a2c14' : '#7a4c1e'); }
      for (let xx = -bw; xx <= bw; xx++) R(bx + xx, bb - q(18), 1, 2, this.bay(xx + 7, 3) < 0.4 ? '#ff6a2c' : '#ffb040');
      for (let i = -3; i <= 3; i++) { const fh = Math.round(q(9) + q(7) * Math.abs(Math.sin(t * 8 + i * 1.7)) + (3 - Math.abs(i)) * 2); for (let k = 0; k < fh; k++) { const w2 = Math.max(0, Math.round((2 - k / fh * 2)) ); const fx = bx + i * 3 + Math.round(Math.sin(t * 6 + i + k * 0.2) * k * 0.08); R(fx - w2, bb - q(18) - k, w2 * 2 + 1, 1, k < fh * 0.35 ? '#ffe9a0' : k < fh * 0.7 ? '#ffa23c' : '#e8481c'); } }
      for (let i = 0; i < 6; i++) { const ph = (t * 0.7 + i / 6) % 1; R(bx + Math.round(Math.sin(i * 3.1 + t) * q(8)), bb - q(18) - Math.round(ph * q(40)), 1, 1, ph < 0.6 ? '#ffd070' : '#c88a50'); } }
  }
  draw() {
    const { ctx: c, M, t, mx, R } = this, o = k => Math.round(mx * k) - M;
    c.globalAlpha = 1; c.drawImage(this.L0, o(2), 0);
    const o1 = o(4); c.drawImage(this.L1, o1, 0);
    for (const d of this.doors || []) { const ph = d.ph, mv = Math.sin(t * 0.5 + ph), sx = Math.round(d.x + d.w * (0.5 + 0.22 * mv)), by = d.y + d.h - 1, fh = Math.round(d.h * 0.72); c.globalAlpha = 0.78; R(sx - 1, by - fh, 3, 3, '#4a2418'); R(sx - 2, by - fh + 3, 5, fh - 5, '#4a2418'); R(sx - 2, by - 2, 2, 2, '#3a1c12'); R(sx + 1, by - 2, 2, 2, '#3a1c12'); R(sx - 1 + (mv > 0 ? 2 : -3), by - fh + 5, 1, Math.round(fh * 0.4), '#4a2418'); c.globalAlpha = 1; }
    c.drawImage(this.gM, 0, 0);
    for (const w of this.wins) this.blit(c, this.glow(Math.round(w.r * 1.6), '#ffb468'), w.x + o1, w.y, (w.I || 0.28) * 1.5 * (0.85 + 0.15 * Math.sin(t * 2 + w.ph)) + 0 * (w.I || 0.28) * (0.85 + 0.15 * Math.sin(t * 2 + w.ph)));
    for (const l of this.lants) this.lantern(l.x + o1, l.y, l.s, l.ph);
    { const q = this.q; c.globalCompositeOperation = 'lighter'; for (const l of this.lants) this.blit(c, this.glow(Math.round(q(20) * l.s), '#ff8a44'), l.x + o1, l.y + q(8) * l.s, 0.3 * (0.88 + 0.12 * Math.sin(t * 7 + l.ph * 3))); c.globalCompositeOperation = 'source-over'; }
    const o2 = o(7); c.drawImage(this.L2, o2, 0);
    c.drawImage(this.gS, 0, 0);
    { const q = this.q, gy = this.gy; c.globalCompositeOperation = 'lighter'; for (const l of this.lants) { const gx = l.x + o1, w = Math.round(q(46) * l.s), h = Math.round(q(11) * l.s), a = 0.55 * (0.88 + 0.12 * Math.sin(t * 7 + l.ph * 3)); c.globalAlpha = a; c.drawImage(this.glow(30, '#ff9048'), gx - w, gy + q(5) - h * 0.5, w * 2, h); }
      for (const w of this.wins) if ((w.I || 0.28) > 0.25) { c.globalAlpha = 0.16; c.drawImage(this.glow(30, '#ffb060'), w.x + o1 - q(14), gy - q(1), q(28), q(10)); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    for (const f of this.flakes) if (!f.l) R(f.x, f.y, 1, 1, '#fbf8ff');
    const ox = o2 + M, list = this.crowd.map(p => { const [x, y, k] = this.pos(p); return { p, x: x + ox, y, k }; }).sort((a, b) => a.y - b.y || a.x - b.x);
    for (const e of list) this.fig(e.p, e.x, e.y, e.k);
    this.sparkle(o2 + M); this.fore(o2 + M);
    c.drawImage(this.L3, o(14), 0);
    for (const p of this.petals) R(p.x, p.y, Math.sin(t * 3 + p.ph) > 0 ? 2 : 1, 1, p.c);
    for (const f of this.flakes) if (f.l) R(f.x, f.y, 2, 2, '#ffffff');
    c.drawImage(this.gF, 0, 0); c.drawImage(this.gT, 0, 0); c.drawImage(this.gV, 0, 0); this.bloom(0.22);
    this.drawText(o1);
  }
  drawText(o1) {
    const T = this.tctx, D = this.dpr, px = this.px; T.setTransform(D, 0, 0, D, 0, 0); T.clearRect(0, 0, this.W, this.H); T.textAlign = 'center'; T.textBaseline = 'middle';
    T.fillStyle = '#f0d060'; for (const p of this.plaques) { T.font = '700 ' + Math.max(9, Math.round(Math.min(p.h * 0.8, p.w / 3.4) * px)) + 'px "Songti SC","STSong","Noto Serif SC",serif'; T.fillText(p.t, (p.x + o1 + 0.5) * px, (p.y + 0.6) * px); }
  }
}

export function startScene(canvas, textCanvas, props) {
  const scene = new HongloumengScene(canvas, textCanvas, props);
  scene.mount();
  return scene;
}
