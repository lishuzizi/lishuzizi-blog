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
  bay(x, y) { return (this.BAY[(y & 3) * 4 + (x & 3)] + 0.5) / 16; }
  gradImg(x, W, H, ramp, curve) {
    const img = x.createImageData(W, H), d = img.data, C = ramp.map(h => this.hx(h)), n = C.length - 1;
    for (let y = 0; y < H; y++) { const f = Math.pow(y / Math.max(1, H - 1), curve) * n, b = Math.floor(f), fr = f - b;
      for (let xx = 0; xx < W; xx++) { const c = C[Math.min(n, fr > this.bay(xx, y) ? b + 1 : b)], i = (y * W + xx) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; } }
    x.putImageData(img, 0, 0);
  }
  glow(r, hex) {
    r = Math.max(2, Math.round(r)); const key = r + hex; if (this.glowC[key]) return this.glowC[key];
    const s = 2 * r + 1, [c, x] = this.mk(s, s), img = x.createImageData(s, s), d = img.data, col = this.hx(hex);
    for (let yy = 0; yy < s; yy++) for (let xx = 0; xx < s; xx++) { const dd = Math.hypot(xx - r, yy - r) / r; if (dd >= 1) continue; const a = Math.pow(1 - dd, 1.7), lv = Math.floor(a * 6 + this.bay(xx, yy)) / 6, i = (yy * s + xx) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = Math.min(255, lv * 255); }
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
    this.buildSky(); this.buildMid(); this.buildGround(); this.buildPlum(); this.buildCrowd(); this.buildFx();
  }

  buildSky() {
    const { FW, PW, M, gy, q, u } = this, [c, x] = this.mk(FW, this.PH), R = this.painter(x), r = this.rng(4); this.L0 = c;
    const [gc, gx] = this.mk(FW, gy + 2); this.gradImg(gx, FW, gy + 2, ['#766a92', '#8e7b9c', '#a987a2', '#c396a2', '#d9a8a2', '#e8bca8', '#f2d0b6'], 0.85); x.drawImage(gc, 0, 0);
    const mx = M + Math.round(PW * (this.mob ? 0.3 : 0.66)), my = q(40), mr = Math.max(4, q(10));
    this.blit(x, this.glow(mr * 3.2, '#ffe8d0'), mx, my, 0.55);
    for (let yy = -mr; yy <= mr; yy++) for (let xx = -mr; xx <= mr; xx++) { const d = Math.hypot(xx, yy) / mr; if (d > 1.02) continue; let col = d > 0.86 ? '#f6e4cc' : '#fff4e2'; if ((xx + yy) / mr > 0.35 && this.bay(xx + 64, yy + 64) < (xx + yy) / mr - 0.35) col = '#efdac2'; R(mx + xx, my + yy, 1, 1, col); }
    [[-0.35, -0.25, 0.24], [0.3, 0.2, 0.17], [-0.05, 0.5, 0.13]].forEach(([a, b, s]) => { const cx = Math.round(mx + a * mr), cy = Math.round(my + b * mr), rr = Math.max(1, Math.round(s * mr)); for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr; xx <= rr; xx++) if (xx * xx + yy * yy <= rr * rr) R(cx + xx, cy + yy, 1, 1, '#ecd6c0'); });
    const ridge = (base, amp, sd, body, lit, cap) => { for (let xx = 0; xx < FW; xx++) { const X = xx / u, hgt = amp * (0.5 + 0.3 * Math.sin(X * 0.011 + sd) + 0.15 * Math.sin(X * 0.034 + sd * 2) + 0.05 * Math.sin(X * 0.1 + sd)), top = Math.round(base - hgt); R(xx, top, 1, gy + 2 - top, body); const sn = Math.max(1, Math.round(q(4) * (0.45 + 0.55 * Math.sin(X * 0.045 + sd)))); for (let k = 0; k < sn; k++) if (k === 0 || this.bay(xx, top + k) < 1 - k / sn) R(xx, top + k, 1, 1, cap); if (r() < 0.08) R(xx, top + sn + 1 + Math.floor(r() * q(6)), 1, q(2), lit); } };
    ridge(gy - q(34), q(44), 1.2, '#a292ac', '#b8a8bc', '#ece2e8'); ridge(gy - q(16), q(28), 3.4, '#8f7c9c', '#a896b0', '#e0d4de');
  }

  roofP(cx, ey, hw, h) {
    const R = this.B, q = this.q, top = ey - h, rw = Math.round(hw * 0.36), tip = Math.max(2, q(5));
    const halfAt = k => Math.round(rw + (hw - rw) * Math.pow(k / Math.max(1, h - 1), 0.8));
    for (let k = 0; k < h; k++) { const half = halfAt(k), yy = top + k; for (let xx = -half; xx <= half; xx++) { const m = ((xx % 3) + 3) % 3; R(cx + xx, yy, 1, 1, k === h - 1 ? (m === 0 ? '#6a6272' : '#1a1620') : m === 0 ? '#4c4452' : m === 1 ? '#3a3442' : '#2c2834'); } }
    for (const sd of [-1, 1]) for (let i = 1; i <= tip; i++) { const xx = cx + sd * (hw + i), yy = ey - 1 - Math.round(i * i / tip * 0.8); R(xx, yy, 1, 2, '#2c2834'); if (i === tip) { R(xx, yy - 1, 1, 1, '#2c2834'); R(xx, yy + 2, 1, 1, '#8a6a20'); R(xx, yy + 3, 1, 1, '#f0c850'); } }
    R(cx - hw, ey, 2 * hw + 1, 1, '#140e12');
    for (let xx = -hw; xx <= hw; xx++) { const ax = Math.abs(xx), k0 = ax <= rw ? 0 : Math.round(Math.pow((ax - rw) / Math.max(1, hw - rw), 1 / 0.8) * (h - 1)), dep = Math.max(1, Math.round(h * 0.42 + Math.sin(xx * 0.55 + cx) * q(1.2) + Math.sin(xx * 0.17) * q(1.5)));
      for (let k = k0; k < Math.min(h - 1, k0 + dep); k++) R(cx + xx, top + k, 1, 1, k === k0 + dep - 1 ? '#d6ccd8' : '#fbf7f6'); }
    const rh = Math.max(2, q(3)); R(cx - rw - 1, top - rh, 2 * rw + 3, rh, '#2a2430'); R(cx - rw - 1, top - rh - 1, 2 * rw + 3, Math.max(1, q(1.5)), '#fbf7f6');
    for (const sd of [-1, 1]) { const ex = cx + sd * (rw + 1) - (sd > 0 ? 1 : 0); R(ex, top - rh - q(3), 2, q(3), '#2a2430'); R(ex - sd, top - rh - q(4), 2, q(1.5), '#2a2430'); R(ex, top - rh - q(3) - 1, 2, 1, '#fbf7f6'); }
  }
  hall(cx, by, w, bh, rh, tiers, name) {
    const R = this.B, q = this.q, r = this.r; cx = Math.round(cx); w = Math.round(w);
    let top = by - bh;
    const body = (bw, top, bh, nm) => { const bx = Math.round(cx - bw / 2);
      for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) R(bx + xx, top + yy, 1, 1, yy / bh > 0.5 + this.bay(bx + xx, top + yy) * 0.4 ? '#8e2e20' : '#a8382a');
      const n = Math.max(2, Math.round(bw / q(18))), ww = bw / n, sh = Math.max(2, q(3.5));
      for (let i = 0; i < n; i++) { const wx = Math.round(bx + ww * i + ww * 0.2), wd = Math.round(ww * 0.6), wy = top + sh + Math.max(2, Math.round((bh - sh) * 0.22)), wh = Math.max(3, Math.round((bh - sh) * 0.6));
        for (let yy = 0; yy < wh; yy++) for (let xx = 0; xx < wd; xx++) { const grid = xx % 3 === 1 || yy % 3 === 1, d = Math.hypot((xx - wd / 2) / (wd / 2), (yy - wh / 2) / (wh / 2)); R(wx + xx, wy + yy, 1, 1, grid ? '#7a2a1c' : d * 0.7 + this.bay(wx + xx, wy + yy) * 0.45 < 0.7 ? '#ffd890' : '#f0a85a'); }
        R(wx - 1, wy - 1, wd + 2, 1, '#e2b84a'); R(wx - 1, wy + wh, wd + 2, 1, '#e2b84a');
        this.wins.push({ x: wx + wd / 2, y: wy + wh / 2, r: Math.max(wd, wh) * 1.2, ph: r() * 6 }); }
      for (let i = 0; i <= n; i++) { const pxx = Math.round(bx + ww * i) - 1; R(pxx, top, 2, bh, '#6e2014'); R(pxx, top, 1, bh, '#9a3a28'); }
      const cols = ['#2f7f74', '#e2b84a', '#2a5a9a', '#e2b84a'], cw = Math.max(2, q(3));
      for (let xx = 0; xx < bw; xx++) { const ci = Math.floor(xx / cw) % 4; R(bx + xx, top, 1, sh, cols[ci]); if (ci === 0 && xx % cw === 1) R(bx + xx, top + 1, 1, 1, '#f4ecd8'); }
      R(bx, top + sh, bw, 1, '#1a1216');
      if (nm) { const pw = Math.min(Math.round(bw * 0.38), q(34)), ph = Math.max(6, q(9)), px0 = Math.round(cx - pw / 2), py0 = top + sh + 1; R(px0 - 1, py0 - 1, pw + 2, ph + 2, '#e2b84a'); R(px0, py0, pw, ph, '#1e1412'); this.plaques.push({ x: cx, y: py0 + ph / 2, w: pw, h: ph, t: nm }); }
    };
    body(Math.round(w * 0.74), top, bh, name);
    for (let t = 0; t < tiers; t++) { const hw = Math.round(w * (0.58 - t * 0.14)), h = Math.round(rh * (1 - t * 0.14)); this.roofP(cx, top, hw, h); top -= Math.round(h * 0.86); if (t < tiers - 1) { const ub = Math.round(bh * 0.55); body(Math.round(w * 0.47), top - ub, ub, null); top -= ub; } }
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
    const wt = this.wallTop = gy - q(44);
    this.bamboo(M + PW * 0.46, wt); this.bamboo(M + PW * 0.965, wt);
    const hw_ = (f, cap) => Math.min(PW * f, q(cap));
    this.hall(M + PW * 0.1, wt + q(4), hw_(0.2, 96), q(26), q(20), 1, '蘅芜苑');
    this.hall(M + PW * 0.57, wt + q(4), hw_(0.24, 118), q(30), q(26), 2, '怡红院');
    this.hall(M + PW * 0.9, wt + q(4), hw_(0.2, 100), q(28), q(22), 1, '潇湘馆');
    const gx = Math.round(M + PW * (mob ? 0.8 : 0.74)), gr = q(20), gc = gy - Math.round(gr * 0.98), ring = Math.max(2, q(3)), WC = ['#cc5642', '#bb4633', '#a43928'];
    for (let yy = wt; yy < gy; yy++) { const f = (yy - wt) / (gy - wt); for (let xx = 0; xx < FW; xx++) { const d = Math.hypot(xx - gx, yy - gc); let col;
      if (d < gr) { if (yy > gc + gr * 0.3) col = this.bay(xx, yy) < 0.15 ? '#e8dee6' : '#fbf6f2'; else col = (yy - (gc - gr)) / (gr * 1.3) > this.bay(xx, yy) * 0.6 + 0.4 ? '#f6e2d0' : '#efd4c4'; }
      else if (d < gr + ring) col = d < gr + 1 ? '#8a3020' : (yy < gc ? '#e2d6ce' : '#cbbeb8');
      else col = WC[Math.max(0, Math.min(2, Math.floor(f * 2.3 + this.bay(xx, yy) - 0.6)))];
      R(xx, yy, 1, 1, col); } }
    for (let xx = q(10); xx < FW; xx += q(22)) { if (Math.abs(xx - gx) < gr + ring + 2) continue; R(xx, wt + q(4), 1, gy - wt - q(8), '#9a3424'); R(xx + 1, wt + q(4), 1, gy - wt - q(8), '#d6644e'); }
    const inG = (a, b) => Math.hypot(a - gx, b - gc) < gr - 1;
    const tr = (a, b, c2, d2, th) => this.pl((xa, ya, w, h, col) => { if (inG(xa, ya)) R(xa, ya, w, h, col); }, a, b, c2, d2, th, '#3a2a28');
    tr(gx - gr * 0.25, gc + gr * 0.6, gx - gr * 0.05, gc - gr * 0.2, Math.max(1, q(2))); tr(gx - gr * 0.05, gc - gr * 0.2, gx + gr * 0.4, gc - gr * 0.5, 1); tr(gx - gr * 0.12, gc + gr * 0.1, gx - gr * 0.55, gc - gr * 0.3, 1);
    for (let i = 0; i < 18; i++) { const a = Math.round(gx + (r() - 0.5) * gr * 1.3), b = Math.round(gc - gr * 0.65 + r() * gr * 0.8); if (inG(a, b)) { R(a, b, 1, 1, '#d8304a'); if (r() < 0.5 && inG(a + 1, b)) R(a + 1, b, 1, 1, '#e86a7a'); } }
    [0.07, 0.2, 0.33, 0.46, 0.62, 0.88].forEach(fx => { const wx = Math.round(M + PW * fx); if (Math.abs(wx - gx) < gr + q(14)) return; const sz = q(14), y0 = wt + q(13), x0 = wx - (sz >> 1);
      R(x0 - 2, y0 - 2, sz + 4, sz + 4, '#dcd0c8'); R(x0 - 2, y0 + sz + 1, sz + 4, 1, '#b8aaa4');
      for (let yy = 0; yy < sz; yy++) for (let xx = 0; xx < sz; xx++) { const lat = (xx + yy) % 4 === 0 || (xx - yy + 400) % 4 === 0, dd = Math.hypot(xx - sz / 2, yy - sz / 2) / (sz * 0.6); R(x0 + xx, y0 + yy, 1, 1, lat ? '#6a2418' : dd + this.bay(xx, yy) * 0.4 < 0.75 ? '#ffd890' : '#e8a45a'); }
      this.wins.push({ x: wx, y: y0 + sz / 2, r: sz, ph: r() * 6, I: 0.22 }); });
    const ph0 = Math.max(2, q(3)); R(0, gy - ph0, FW, ph0, '#d8ccc4'); R(0, gy - ph0, FW, 1, '#ece2dc'); for (let xx = 0; xx < FW; xx += q(12)) if (!inG(xx, gy - 2)) R(xx, gy - ph0, 1, ph0, '#b8aca8');
    const ch = Math.max(3, q(4));
    for (let k = 0; k < ch; k++) for (let xx = 0; xx < FW; xx++) { const m = xx % 3; R(xx, wt - ch + k, 1, 1, k === ch - 1 ? (m === 0 ? '#6a6272' : '#1a1620') : m === 0 ? '#4c4452' : m === 1 ? '#3a3442' : '#2c2834'); }
    R(0, wt, FW, 1, '#1a1216');
    for (let xx = 0; xx < FW; xx++) { const sh = Math.max(1, Math.round(q(2.5) + Math.sin(xx * 0.3) * 0.8 + Math.sin(xx * 0.07 + 1) * q(1.2))); R(xx, wt - ch - sh + 1, 1, sh, '#fbf7f6'); if (this.bay(xx, 0) < 0.5) R(xx, wt - ch + 1, 1, 1, '#dcd2dc'); }
    for (let xx = 0; xx < FW; xx += 2 + Math.floor(r() * 5)) if (r() < 0.5) R(xx, wt + 1, 1, 1 + Math.floor(r() * 2), '#eef0f6');
    this.lants = [0.05, 0.2, 0.36, 0.5, 0.64, 0.86].map((fx, i) => ({ x: Math.round(M + PW * fx), y: wt + 1, s: this.u * 0.9, ph: i * 1.7 })).filter(l => Math.abs(l.x - gx) > gr + q(10));
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
    const [gc, gx] = this.mk(FW, PH - gy); this.gradImg(gx, FW, PH - gy, ['#fdfaf6', '#f6f0f0', '#ece4ea', '#e0d6e0', '#d4c8d6'], 1.1); x.drawImage(gc, 0, gy);
    for (let i = 0; i < 26; i++) { const y0 = gy + 3 + Math.floor(r() * (PH - gy - 3)), x0 = Math.floor(r() * FW), L = q(20 + r() * 60); for (let xx = 0; xx < L; xx++) if (this.bay(x0 + xx, y0) < 0.5 * Math.sin(xx / L * Math.PI) + 0.1) R(x0 + xx, y0, 1, 1, '#ddd2e0'); for (let xx = 2; xx < L - 2; xx++) if (this.bay(x0 + xx, y0 - 1) < 0.4) R(x0 + xx, y0 - 1, 1, 1, '#ffffff'); }
    for (let i = 0; i < FW * (PH - gy) / 90; i++) R(r() * FW, gy + r() * (PH - gy), 1, 1, r() < 0.5 ? '#ffffff' : '#e6dce8');
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
          if (v < trimTo) col = trim; else if (xx === a) col = pal[1]; else if (xx === b || (fr > 0.64 && this.bay(xx, yy) < (fr - 0.64) * 2.8)) col = pal[2];
          R(xx, yy, 1, 1, col); } } };
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
      for (let xx = a; xx <= b; xx++) { const back = f > 0 ? xx - a : b - xx; let col = back === 0 ? skinD : skin; if (dv > 0.7 || (dv > -1.8 && back < Math.max(1, 1.2 * k))) col = hair; R(xx, yy, 1, 1, col); } }
    const ex = hx + f * Math.max(1, Q(0.9)), ey = Yu(30.1), gap = Math.max(1, Q(1.3)), blink = (t * 0.6 + ph) % 3.7 < 0.12;
    if (!blink) { R(ex - gap, ey, 1, 1, '#2a1a1a'); R(ex + gap, ey, 1, 1, '#2a1a1a'); }
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
      for (let i = 0; i <= n; i++) { const hw = Math.round(RW * Math.sqrt(1 - Math.pow((n - i) / n, 2))), yy = ut + i; for (let xx = -hw; xx <= hw; xx++) { const fr = (xx + hw) / Math.max(1, 2 * hw); let col = Math.abs(xx) % rib === 0 ? '#e8805a' : '#d24a30'; if (fr > 0.68 && this.bay(xx + 50, yy) < (fr - 0.68) * 3) col = '#a8321e'; if (i === n) col = (xx & 1) ? '#8a2418' : '#d24a30'; if (i < Math.max(1, n * 0.35) || (i < n * 0.5 && this.bay(xx + 50, yy) < 0.5)) col = '#fbf7f6'; R(ux + xx, yy, 1, 1, col); } }
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
  draw() {
    const { ctx: c, M, t, mx, R } = this, o = k => Math.round(mx * k) - M;
    c.globalAlpha = 1; c.drawImage(this.L0, o(2), 0);
    const o1 = o(4); c.drawImage(this.L1, o1, 0);
    for (const w of this.wins) this.blit(c, this.glow(Math.round(w.r), '#ffb468'), w.x + o1, w.y, (w.I || 0.28) * (0.85 + 0.15 * Math.sin(t * 2 + w.ph)));
    for (const l of this.lants) this.lantern(l.x + o1, l.y, l.s, l.ph);
    const o2 = o(7); c.drawImage(this.L2, o2, 0);
    for (const f of this.flakes) if (!f.l) R(f.x, f.y, 1, 1, '#fbf8ff');
    const ox = o2 + M, list = this.crowd.map(p => { const [x, y, k] = this.pos(p); return { p, x: x + ox, y, k }; }).sort((a, b) => a.y - b.y || a.x - b.x);
    for (const e of list) this.fig(e.p, e.x, e.y, e.k);
    c.drawImage(this.L3, o(14), 0);
    for (const p of this.petals) R(p.x, p.y, Math.sin(t * 3 + p.ph) > 0 ? 2 : 1, 1, p.c);
    for (const f of this.flakes) if (f.l) R(f.x, f.y, 2, 2, '#ffffff');
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
