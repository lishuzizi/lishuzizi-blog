/**
 * 项目 — 逐像素绘制的黄昏拱门庭院场景（canvas 2D，双画布：场景 + 文字）
 *
 * 来源：AI 设计稿（dc 格式）中的 Component 类，外壳从 React/DCLogic 改写为原生 JS，
 * 内部绘制逻辑逐字保留，画面与原设计一致。
 *
 * 用法：import { startScene } from "@/scripts/projects-scene";
 *       const scene = startScene(canvas, textCanvas);
 *       scene.hot = 0..2   // 悬停第 n 张卡片时让对应拱门高亮，-1 取消
 */

const PROPS = { pixelSize: 0, speed: 1, parallax: true };

export class ProjectsScene {
  props = { ...PROPS };
  t = 0; mx = 0; mt = 0; last = 0; acc = 0; parts = []; hot = -1; hv = [0, 0, 0];
  BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  constructor(canvas, textCanvas, props) {
    this.canvasRef = { current: canvas };
    this.textRef = { current: textCanvas };
    if (props) Object.assign(this.props, props);
  }

  mount() {
    this.reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.ctx = this.canvasRef.current.getContext('2d'); this.tctx = this.textRef.current.getContext('2d'); this.R = this.painter(this.ctx);
    this.build();
    this.resize = () => this.build();
    this.onMove = e => { this.mt = (e.clientX / window.innerWidth) * 2 - 1; };
    this.onVis = () => { this.hidden = document.hidden; this.last = performance.now(); };
    window.addEventListener('resize', this.resize); window.addEventListener('pointermove', this.onMove); document.addEventListener('visibilitychange', this.onVis);
    this.onDown = e => { const px = this.px || 2, o1 = Math.round(this.mx * 5) - this.M, x = e.clientX / px - o1, y = e.clientY / px; let hit = false;
        for (const p of this.pets) { const s = this.ps * p.sc * this.dep(p.y); if (Math.abs(x - p.x) < 9 * s && y < p.y + 3 && y > p.y - 22 * s) { hit = true; p.ex = this.t + 2.5; for (let i = 0; i < 4; i++) this.parts.push({ k: 'heart', x: p.x + (Math.random() - 0.5) * 8 * s, y: p.y - 16 * s, vx: (Math.random() - 0.5) * 8, vy: -(8 + Math.random() * 8), life: 1.6, t0: this.t + i * 0.12 }); } }
        if (!hit) for (let i = 0; i < 8; i++) this.parts.push({ k: 'leaf', x, y, vx: (Math.random() - 0.5) * 40, vy: -(10 + Math.random() * 22), life: 1.1, t0: this.t, c: ['#e8b040', '#d8803a', '#c85a30', '#e8d070'][i % 4] }); };
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
  sn(x, y) { return this.vn(x * 0.28 + 11, y * 0.3 + 7); }
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
    const W = Math.max(320, window.innerWidth || 0), H = Math.max(360, window.innerHeight || 0), mob = W < 700, dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = this.props.pixelSize > 0 ? Math.round(this.props.pixelSize) : Math.max(2, Math.round(H / 380));
    const PW = Math.ceil(W / px), PH = Math.ceil(H / px), u = PH / 360, M = 10, A = Math.min(u, PW / 250);
    Object.assign(this, { W, H, mob, px, PW, PH, u, M, A, dpr, FW: PW + 2 * M, glowC: {}, ps: Math.max(1, A * 1.05) });
    this.q = v => Math.round(v * u); this.qa = v => Math.max(1, Math.round(v * A)); this.X = f => M + Math.round(PW * f);
    c.width = PW; c.height = PH; this.ctx.imageSmoothingEnabled = false; this.R = this.painter(this.ctx);
    tc.width = Math.round(W * dpr); tc.height = Math.round(H * dpr);
    this.gy = Math.round(PH * 0.42); this.yB = Math.round(PH * 0.64); this.cx0 = this.X(mob ? 0.5 : 0.64); this.sunX = this.cx0 + this.qa(6);
    this.lamps = []; this.buildSky(); this.buildScene(); this.buildFx();
  }

  buildSky() {
    const { FW, PH, gy, q, sunX } = this, [c, x] = this.mk(FW, PH), R = this.painter(x); this.L0 = c;
    const [gc, gx] = this.mk(FW, gy + 2); this.gradImg(gx, FW, gy + 2, ['#2c3878', '#4e4a94', '#8a64a0', '#cc7c92', '#f09a78', '#ffc084', '#ffe4ae'], 1.2); x.drawImage(gc, 0, 0);
    const sy = gy - q(26), sr = Math.max(5, q(19));
    for (let yy = 0; yy < sy; yy++) for (let xx = 0; xx < FW; xx++) { const dx = xx - sunX, dy = yy - sy, d = Math.hypot(dx, dy), an = Math.atan2(dy, dx), ray = Math.sin(an * 11 + 1.3) * 0.5 + 0.5, fall = Math.max(0, 1 - d / (q(260))); if (ray > 0.55 && fall > 0) R(xx, yy, 1, 1, 'rgba(255,228,176,' + Math.min(0.3, (ray - 0.55) * fall * 0.5) + ')'); }
    this.blit(x, this.glow(q(190), '#ff9a5a'), sunX, sy, 0.5); this.blit(x, this.glow(q(80), '#ffd090'), sunX, sy, 0.65);
    for (let yy = -sr; yy <= sr; yy++) for (let xx = -sr; xx <= sr; xx++) { const d = Math.hypot(xx, yy) / sr; if (d > 1) continue; R(sunX + xx, sy + yy, 1, 1, d > 0.82 + (this.bay(xx + 40, yy + 40) - 0.5) * 0.1 ? '#ffd890' : '#fff2cc'); }
  }

  tree(R, x, base, sc) {
    const dir = this.sunX > x ? 1 : -1, tw = Math.max(2, Math.round(3 * sc)), th = Math.round(34 * sc);
    for (let yy = 0; yy < th; yy++) R(x - (tw >> 1), base - yy, tw, 1, yy % 5 === 0 ? '#2a1e28' : '#4a3236'); R(x - (tw >> 1) + (dir > 0 ? tw - 1 : 0), base - th, 1, th, '#a8705a');
    [[0, 36, 15], [-12, 28, 11], [12, 29, 12], [-3, 47, 10], [8, 42, 9], [-15, 40, 8]].forEach(([bx, by, br]) => { const cx = Math.round(x + bx * sc), cy = Math.round(base - by * sc), r = Math.round(br * sc);
      for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { if (xx * xx + yy * yy > r * r + r * 0.6) continue; const l = (xx / r) * dir * 0.8 - (yy / r) * 0.7 + (this.sn(cx + xx, cy + yy) - 0.5) * 0.4; R(cx + xx, cy + yy, 1, 1, l > 0.8 ? '#e4b860' : l > 0.38 ? '#86ac58' : l > -0.2 ? '#4f8450' : '#33594a'); } });
  }
  arch(R, cx, yb, d) {
    const { wb, ws, wt, h, hs, th } = d, P = [[cx - wb, yb], [cx - ws, yb - hs], [cx - wt, yb - h], [cx + wt, yb - h], [cx + ws, yb - hs], [cx + wb, yb]], ht = th / 2;
    const x0 = Math.floor(cx - ws - th), x1 = Math.ceil(cx + ws + th), y0 = Math.floor(yb - h - th);
    for (let y = y0; y <= yb; y++) for (let x = x0; x <= x1; x++) {
      let best = 1e9, sg = 0, si = 0;
      for (let i = 0; i < 5; i++) { const [ax, ay] = P[i], [bx, by] = P[i + 1], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy, tt = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / L2)), dd = Math.hypot(ax + dx * tt - x - 0.5, ay + dy * tt - y - 0.5); if (dd < best) { best = dd; sg = (dx * (y + 0.5 - ay) - dy * (x + 0.5 - ax)) / Math.sqrt(L2); si = i; } }
      if (best > ht) continue;
      const v = sg / ht + (this.sn(x, y) - 0.5) * 0.18;
      let col = v < -0.6 ? '#fff0c8' : v < 0.3 ? '#e8d6aa' : v < 0.72 ? '#c8b08a' : '#a48c6e';
      if (si === 2 && v < 0.2) col = v < -0.4 ? '#fff6d8' : '#f2e2b8';
      R(x, y, 1, 1, col);
    }
  }
  plinth(R, x0, x1, yt, yb) { x0 = Math.round(x0); x1 = Math.round(x1); for (let y = yt; y < yb; y++) for (let x = x0; x < x1; x++) { const rel = y - yt, row = Math.floor(rel / 4); const col = rel < 2 ? '#aaa6b6' : (rel % 4 === 0 || (x - x0 + (row & 1) * 5) % 10 === 0) ? '#5e5c6c' : x > x1 - 3 ? '#62606e' : x < x0 + 2 ? '#a09cac' : this.sn(x, y) < 0.25 ? '#76748a' : '#84829a'; R(x, y, 1, 1, col); } }
  ctree(R, x, base, sc) {
    const dir = this.sunX > x ? 1 : -1, rx = Math.max(2, 6.5 * sc), ry = Math.max(4, 21 * sc), cy = base - 6 * sc - ry; x = Math.round(x);
    R(x - Math.max(1, Math.round(sc)), base - 7 * sc, Math.max(2, Math.round(2 * sc)), 7 * sc + 1, '#3a2a2e');
    for (let yy = -Math.ceil(ry); yy <= Math.ceil(ry); yy++) { const fy = yy / ry, w = rx * Math.sqrt(Math.max(0, 1 - fy * fy)) * (0.8 + 0.2 * Math.sin(yy * 0.9 + x)) * (fy < 0 ? 1 - 0.35 * -fy : 1);
      for (let xx = -Math.ceil(w); xx <= Math.ceil(w); xx++) { const l = (xx / rx) * dir * 0.55 - fy * 0.75 + (this.sn(x + xx, Math.round(cy + yy)) - 0.5) * 0.5 + Math.sin((x + xx) * 1.7 + yy * 2.3) * 0.15; R(x + xx, cy + yy, 1, 1, l > 0.85 ? '#e0b864' : l > 0.4 ? '#6e9c58' : l > -0.15 ? '#4a7c4a' : '#2e5440'); } }
  }
  lampPost(R, x, base, hgt, side) { x = Math.round(x); const w = hgt > 30 ? 2 : 1; for (let yy = 0; yy < hgt; yy++) R(x, base - yy, w, 1, '#3a2c48'); const al = Math.max(2, Math.round(hgt * 0.16)); R(Math.min(x, x + side * al), base - hgt, al + 1, 1, '#3a2c48'); const hx = x + side * al; R(hx - 1, base - hgt + 1, 3, Math.max(1, Math.round(hgt / 30)), '#ffe4a0'); this.lamps.push({ x: hx, y: base - hgt + 2, r: Math.max(4, Math.round(hgt * 0.3)) }); }
  bench(R, x, seatY, w) {
    R(x - w / 2, seatY, w, 3, '#8a5a3a'); R(x - w / 2, seatY, w, 1, '#c88a58'); R(x - w / 2, seatY + 3, w, 1, '#4a2e22');
    R(x - w / 2, seatY - 10, w, 2, '#8a5a3a'); R(x - w / 2, seatY - 10, w, 1, '#c88a58'); R(x - w / 2, seatY - 6, w, 2, '#7a4a30');
    R(x - w / 2 + 2, seatY - 10, 2, 10, '#5a3a2a'); R(x + w / 2 - 4, seatY - 10, 2, 10, '#5a3a2a'); R(x - w / 2 + 2, seatY + 4, 2, 8, '#3a2c48'); R(x + w / 2 - 4, seatY + 4, 2, 8, '#3a2c48');
  }
  buildScene() {
    const { FW, PW, PH, gy, yB, q, qa, cx0, mob } = this, [c, x] = this.mk(FW, PH), R = this.B = this.painter(x), r = this.rng(12); this.L1 = c;
    const lerp = (a, b, f) => a + (b - a) * f;
    const prof = (xx, base, amp, sd) => { const X = xx / this.u; return base - amp * (0.5 + 0.3 * Math.sin(X * 0.012 + sd) + 0.15 * Math.sin(X * 0.033 + sd * 2) + 0.05 * Math.sin(X * 0.09 + sd)); };
    for (let xx = 0; xx < FW; xx++) { const tf = prof(xx, gy - q(12), q(26), 0.4), top = Math.floor(tf), RL = q(6); R(xx, top, 1, gy - top + 2, '#8a78a6'); for (let yy = top; yy < top + RL + 1; yy++) { const d = yy + 1 - tf; if (d <= 0) continue; const a = Math.min(1, d) * 0.9 * Math.max(0, 1 - d / RL); R(xx, yy, 1, 1, 'rgba(250,184,160,' + a + ')'); } R(xx, top, 1, 1, 'rgba(255,214,190,' + (1 - (tf - top)) * 0.7 + ')'); }
    for (let xx = 0; xx < FW; xx++) { const tf = prof(xx, gy - q(6), q(22), 1.1), top = Math.floor(tf), RL = q(5); R(xx, top, 1, gy - top + 2, '#7a6896'); for (let yy = top; yy < top + RL + 1; yy++) { const d = yy + 1 - tf; if (d <= 0) continue; R(xx, yy, 1, 1, 'rgba(226,148,142,' + Math.min(1, d) * 0.75 * Math.max(0, 1 - d / RL) + ')'); } }
    for (let xx = 0; xx < FW; xx++) { const X = xx / this.u, tf = gy - q(4) - q(6) * (0.5 + 0.5 * this.vn(X * 0.05, 3)) - q(1.6) * this.vn(X * 0.14, 9) - q(5) * (0.5 + 0.4 * Math.sin(X * 0.02 + 2)), top = Math.floor(tf); R(xx, top, 1, gy - top + 2, '#2f2c58'); for (let yy = top; yy < top + q(3); yy++) { const d = yy + 1 - tf; if (d > 0) R(xx, yy, 1, 1, 'rgba(160,110,112,' + Math.min(1, d) * 0.7 * Math.max(0, 1 - d / q(3)) + ')'); } }
    const bw = Math.round(Math.min(PW * 0.3, qa(200))), bh = q(17), bx = cx0 - (bw >> 1), bt = gy - bh;
    const blk = (x0, w, top, h) => { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { let col = yy === 0 ? '#fff0e8' : xx === w - 1 ? '#b8a8b8' : '#e2d2d4'; if (yy > 1 && yy % 4 === 2 && xx % 5 >= 2 && xx % 5 <= 3 && xx > 1 && xx < w - 2) col = r() < 0.1 ? '#ffd890' : '#9a96b0'; R(x0 + xx, top + yy, 1, 1, col); } };
    blk(bx, bw, bt + q(4), bh - q(4) + 2); blk(cx0 - Math.round(bw * 0.22), Math.round(bw * 0.44), bt, bh + 2); blk(cx0 - Math.round(bw * 0.07), Math.round(bw * 0.14), bt - q(7), q(7) + 1);
    R(0, gy, FW, 2, '#2a284e');
    const pyB = yB - q(26), pyF = yB + q(44);
    const fA = y => Math.max(0, Math.min(1, (y - gy) / (pyB - gy))), halfRoad = y => lerp(q(4), PW * 0.17, fA(y)), halfMed = y => lerp(0.6, PW * 0.04, fA(y)), halfWalk = y => halfRoad(y) + lerp(1, q(7), fA(y));
    const apTop = pyB - q(23), hw0 = qa(31) + q(14), hw1 = qa(146), ss = v => v * v * (3 - 2 * v), hwP = y => y < apTop ? -1 : y < yB ? hw0 + (hw1 - hw0) * ss((y - apTop) / (yB - apTop)) : hw1 + (PW - hw1) * Math.pow((y - yB) / (PH - yB), 0.7), eLf = y => cx0 - hwP(y), eRf = y => cx0 + hwP(y);
    const isPlaza = (xx, yy) => yy >= apTop && Math.abs(xx - cx0) <= hwP(yy), isPath = (xx, yy) => yy < pyB && Math.abs(xx - cx0) >= halfMed(yy) && Math.abs(xx - cx0) < halfWalk(yy);
    for (let yy = gy + 2; yy < PH; yy++) { const f = (yy - gy) / (PH - gy);
      for (let xx = 0; xx < FW; xx++) { const b = this.bay(xx, yy), ax = Math.abs(xx - cx0); let col; const gv = f * 1.3 + (this.vn(xx * 0.035, yy * 0.12) - 0.5) * 0.6 + (b - 0.5) * 0.04, grass = gv < 0.25 ? '#94a454' : gv < 0.5 ? '#6f9050' : gv < 0.8 ? '#587a43' : '#466a3c';
        if (yy < pyB && !isPlaza(xx, yy)) col = ax < halfMed(yy) ? grass : ax < halfRoad(yy) ? (b < 0.2 ? '#8a7c90' : '#9a8a9c') : ax < halfWalk(yy) ? '#c8aeae' : grass;
        else if (isPlaza(xx, yy)) { const pf = (yy - apTop) / (PH - apTop), tw = q(16) * (0.5 + pf), th2 = Math.floor(pf * 16), tx = Math.floor((xx - cx0) / tw), hh = Math.abs(Math.sin(tx * 12.9898 + th2 * 78.233) * 43758.5453) % 1, gl = 0.32 * Math.exp(-Math.pow((xx - this.sunX) / (PW * 0.32), 2)) * (1 - pf), v = pf * 1.05 + (this.vn(xx * 0.05, yy * 0.2) - 0.5) * 0.16 + (b - 0.5) * 0.02 + (hh - 0.5) * 0.14 - gl; col = Math.abs(xx - cx0) > hwP(yy) - 2 ? '#ead6ca' : v < 0.12 ? '#ecd0be' : v < 0.34 ? '#dcc0b4' : v < 0.56 ? '#cab0ae' : v < 0.8 ? '#b69ea8' : '#a08ca0'; }
        else col = grass;
        R(xx, yy, 1, 1, col); } }
    const vy = gy - q(120);
    for (let i = -18; i <= 18; i++) { const bx2 = cx0 + i * q(40), k = (apTop - vy) / (PH - vy), tx = cx0 + (bx2 - cx0) * k; this.pl((a, b, w, h, col) => { if (isPlaza(Math.round(a), Math.round(b)) && this.bay(Math.round(a), Math.round(b)) < 0.6) R(a, b, w, h, col); }, tx, apTop, bx2, PH, 1, '#a08898'); }
    for (let k = 1; k <= 9; k++) { const yy = Math.round(apTop + (PH - apTop) * Math.pow(k / 10, 1.5)); for (let xx = Math.round(eLf(yy)); xx < eRf(yy); xx++) if (true) R(xx, yy, 1, 1, '#a08898'); }
    for (let yy = apTop + 2; yy < PH; ) { const f = (yy - apTop) / (PH - apTop), rr = Math.max(2, Math.round(q(2.4 + 5 * f))); for (const [ex, sd] of [[eLf(yy), -1], [eRf(yy), 1]]) { const bx = Math.round(ex + sd * rr * 0.4); for (let y2 = -rr; y2 <= rr; y2++) for (let x2 = -rr; x2 <= rr; x2++) { if (x2 * x2 + y2 * y2 > rr * rr + rr * 0.6) continue; const l = (x2 / rr) * (this.sunX > bx ? 1 : -1) * 0.7 - (y2 / rr) * 0.75 + (this.bay(bx + x2, yy + y2) - 0.5) * 0.4; R(bx + x2, yy - rr * 0.5 + y2, 1, 1, l > 0.7 ? '#d0bc60' : l > 0.25 ? '#76a052' : l > -0.2 ? '#4c7e4a' : '#30563f'); } if (r() < 0.35) R(bx + Math.round((r() - 0.5) * rr), yy - rr, 2, 1, ['#e8506a', '#ffd860', '#f4eee8'][Math.floor(r() * 3)]); } yy += Math.max(2, Math.round(rr * 1.1)); }
    for (let i = 0; i < 460; i++) { const yy = Math.round(gy + 3 + r() * (PH - gy - 3)), xx = Math.round(r() * FW); if (isPlaza(xx, yy) || isPath(xx, yy)) continue; const kk = r(); R(xx, yy, 1, kk < 0.55 ? 2 : 1, kk < 0.55 ? '#3f6a3a' : kk < 0.8 ? '#e8e070' : kk < 0.9 ? '#f4eee8' : '#ff9ab0'); }
    { const mix = (h1, h2, t) => { const a = this.hx(h1), b = this.hx(h2); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join(''); }, at = (h, t) => mix(h, '#b296b0', t);
      const box = (x0, w, top, h, P, fl, wp) => { x0 = Math.round(x0); w = Math.round(w); top = Math.round(top); h = Math.round(h);
        for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const X2 = x0 + xx, Y2 = top + yy, fy = fl ? yy % fl : 1; let col = P.wall;
          if (fl && fy === 0) col = P.band; else if (fl && fy >= 2 && fy < fl - 1 && wp(xx, w)) col = (X2 * 13 + Y2 * 7) % 23 === 0 ? P.lit : P.win;
          if (xx >= w - 2) col = P.side; if (yy === 0) col = P.rim; R(X2, Y2, 1, 1, col); } };
      const bush = (x, y, rr) => { x = Math.round(x); y = Math.round(y); for (let yy = -rr; yy <= Math.round(rr * 0.3); yy++) for (let xx = -rr; xx <= rr; xx++) if (xx * xx + yy * yy <= rr * rr + rr * 0.5) { const l = (xx / rr) * 0.6 - (yy / rr) * 0.7 + (this.bay(x + xx, y + yy) - 0.5) * 0.4; R(x + xx, y + yy, 1, 1, l > 0.55 ? '#b0a85a' : l > 0.1 ? '#6a8a50' : '#4a6a48'); } };
      const hx = this.X(0.27), hy = gy + q(15), hrx = Math.round(PW * 0.19), hry = q(18);
      for (let yy = -hry; yy <= 0; yy++) { const hw = Math.round(hrx * Math.sqrt(1 - (yy / hry) ** 2)); for (let xx = -hw; xx <= hw; xx++) { const l = (xx / hrx) * 0.5 - (yy / hry) * 0.5 + (this.bay(hx + xx, hy + yy) - 0.5) * 0.4; R(hx + xx, hy + yy, 1, 1, l > 0.6 ? at('#a4aa60', 0.3) : l > 0.1 ? at('#6a8c4c', 0.3) : at('#4c7044', 0.3)); } }
      const lw = Math.round(PW * 0.14), lx0 = Math.round(hx - lw / 2), lb = hy - Math.round(hry * 0.55), seg = 5, swd = lw / seg;
      for (let xx = 0; xx < lw; xx++) { const i = Math.floor(xx / swd), u2 = (xx - i * swd) / swd, rt = lb - q(10) - Math.round(i < seg / 2 ? i * q(2) : (seg - 1 - i) * q(2)) - Math.round(u2 * q(2.6)); for (let y = rt; y < lb; y++) { let col = y <= rt + 1 ? at('#7a6a7a', 0.3) : y === rt + 2 ? '#f4c0a8' : at('#ece0d8', 0.32); if (y >= lb - q(4) && y < lb - q(2.5) && xx % 3 !== 0) col = at('#7a7c9a', 0.32); if (u2 > 0.92) col = at('#b8a8b4', 0.3); R(lx0 + xx, y, 1, 1, col); } }
      for (let i = 0; i < 7; i++) { const tx = hx - hrx * 0.9 + i * hrx * (i < 3 ? 0.2 : 0.22) + (i >= 3 ? lw * 0.8 : 0); if (tx > hx + hrx * 0.95) continue; const ty = hy - Math.round(hry * Math.sqrt(Math.max(0, 1 - ((tx - hx) / hrx) ** 2))) + 2; bush(tx, ty, Math.round(q(3.8 + (i % 3) * 1.1))); }
      const ox = this.X(0.25), ow = Math.round(PW * 0.25), ob = gy + q(34), oh = q(22), P1 = { wall: at('#e8d8cc', 0.1), band: at('#f4e6dc', 0.1), win: at('#6e7090', 0.1), lit: '#ffd890', side: at('#b8a4ae', 0.1), rim: '#ffd6b6' };
      box(ox - ow / 2, ow, ob - oh, oh, P1, 5, (xx, w) => xx % 6 >= 2 && xx % 6 <= 3 && xx > 3 && xx < w - 4);
      const cw2 = Math.round(ow * 0.24); box(ox - cw2 / 2, cw2, ob - oh - q(7), oh + q(7), Object.assign({}, P1, { wall: at('#f2e6dc', 0.2) }), 5, xx => xx % 4 === 2);
      R(ox - ow / 2 - 1, ob - oh - 1, ow + 2, 1, at('#8a7a88', 0.2)); R(ox - cw2 / 2 - 1, ob - oh - q(7) - 1, cw2 + 2, 1, at('#8a7a88', 0.2));
      R(ox - cw2 * 0.32, ob - q(4), cw2 * 0.64, q(4), at('#dccccc', 0.2)); for (let i = 0; i <= 4; i++) R(Math.round(ox - cw2 * 0.32 + i * cw2 * 0.16), ob - q(4), 1, q(4), at('#a89aa8', 0.2)); R(ox - 2, ob - q(3), 4, q(3), '#4a3a48');
      for (let i = 0, xx = ox - ow / 2; xx <= ox + ow / 2; xx += q(5), i++) if (Math.abs(xx - ox) > cw2 * 0.4) bush(xx, ob + 1, Math.round(q(3 + (i % 2) * 1.1)));
      const bx = this.X(0.915), bb = gy + q(18), bh = q(50), pw2 = Math.round(PW * 0.065), ramp = ['#f4b090', '#e29aa0', '#bc8aaa', '#9480a8', '#72709a'];
      R(bx - pw2 - 3, bb - q(3), 2 * pw2 + 6, q(3), at('#dccccc', 0.2)); R(bx - pw2 - 3, bb - q(3), 2 * pw2 + 6, 1, '#ffd6b6');
      for (const sd of [-1, 1]) for (let xx = 0; xx < pw2; xx++) { const X2 = bx + sd * (xx + 2), top = bb - q(3) - bh + Math.round((xx / pw2) * q(7)); for (let y = top; y < bb - q(3); y++) { const f = (y - top) / (bb - q(3) - top); let col = at(ramp[Math.max(0, Math.min(4, Math.round(f * 4 + (this.bay(X2, y) - 0.5) * 0.9 - (sd < 0 ? 0.5 : 0))))], 0.18); if ((y - top) % 7 === 0) col = mix(col, '#4a4468', 0.3); if (xx % 9 === 8) col = mix(col, '#4a4468', 0.15); if (sd > 0) col = mix(col, '#4a4468', 0.22); if (y === top) col = '#ffd8b8'; if (xx === pw2 - 1) col = at('#5a5078', 0.2); R(X2, y, 1, 1, col); } }
      R(bx - 2, bb - q(3) - bh - q(4), 4, bh + q(4), at('#f4ece6', 0.15)); R(bx - 2, bb - q(3) - bh - q(4), 4, 1, '#fff2e0'); R(bx + 1, bb - q(3) - bh - q(4), 1, bh + q(4), at('#c8b8c4', 0.15));
      for (let i = 0, xx = bx - pw2 - 2; xx <= bx + pw2 + 2; xx += q(5), i++) bush(xx, bb + 1, Math.round(q(2.2 + (i % 2) * 0.8))); }
    const N = 10;
    for (let k = 0; k <= N; k++) { const s = k / N, yb2 = Math.round(gy + 3 + (pyB - gy - 3) * Math.pow(s, 1.25)), hw = halfWalk(yb2), sc = 0.22 + 1.05 * s;
      for (const sd of [-1, 1]) { this.ctree(R, cx0 + sd * (hw + 40 * sc + q(10) * s), yb2 - 1, sc * 0.95); this.ctree(R, cx0 + sd * (hw + q(4) + 14 * sc), yb2, sc); }
      if (k % 2 === 1) for (const sd of [-1, 1]) this.lampPost(R, cx0 + sd * (halfRoad(yb2) + 1), yb2, Math.round(44 * sc), -sd); }
    this.tree(R, this.X(0.04), pyB + q(16), 1.15); this.tree(R, this.X(0.96), pyB + q(12), 1.05);
    { const mw = qa(62), mh = qa(30), base = pyB - q(7), x0 = Math.round(cx0 - mw / 2), top = base - mh;
      const lx0 = x0 - 6, lx1 = x0 + mw + 6, ly0 = base - q(3), ly1 = base + q(17);
      for (let y = ly0; y <= ly1; y++) for (let xx = lx0; xx <= lx1; xx++) { const edge = y === ly1 || xx === lx0 || xx === lx1; R(xx, y, 1, 1, edge ? '#ead6ca' : this.bay(xx, y) < 0.45 ? '#7a9a52' : '#5e8246'); }
      for (let xx = lx0 + 4; xx < lx1 - 2; xx += 7) { R(xx, base + 1, 1, 1, '#d8d4dc'); }
      for (let y = 0; y < mh; y++) for (let xx = 0; xx < mw; xx++) { const X2 = x0 + xx, Y2 = top + y, row = Math.floor(y / 4); let col = (y % 4 === 0 || (xx + (row & 1) * 3) % 7 === 0) ? '#a8a2b0' : this.bay(X2, Y2) < 0.2 ? '#bcb6c2' : '#cac4cc'; if (y === 0) col = '#f2dcd0'; if (xx === 0) col = '#e0d0d0'; if (xx === mw - 1) col = '#8a8494'; R(X2, Y2, 1, 1, col); }
      const pl = 3, pt = 3, pw = mw - 6, ph2 = Math.round(mh * 0.6);
      for (let y = 0; y < ph2; y++) for (let xx = 0; xx < pw; xx++) { const X2 = x0 + pl + xx, Y2 = top + pt + y, fy = y / ph2, st = Math.abs((xx - y * 1.1) / pw - 0.62) < 0.05 || Math.abs((xx - y * 1.1) / pw - 0.2) < 0.025; let col = fy + (this.bay(X2, Y2) - 0.5) * 0.3 < 0.35 ? '#2c2a3e' : '#16141e'; if (st && this.bay(X2, Y2) < 0.55) col = '#3e3a52'; if (y === 0) col = '#08070c'; R(X2, Y2, 1, 1, col); }
      for (let i = 0; i < 6; i++) { const tx = x0 + pl + Math.round(pw * (0.06 + i * 0.17)), th3 = Math.round(ph2 * (0.4 + (i % 3) * 0.12)); R(tx, top + pt + ph2 - th3, 2, th3, '#1e2a2a'); }
      const ly = top + pt + ph2 + 2; R(x0 - 2, ly, mw + 4, 2, '#8a8494'); R(x0 - 2, ly, mw + 4, 1, '#e8d8d4');
      this.mono = { x: cx0, top: top + pt, w: pw, h: ph2, x0: x0 + pl }; }
    const D = { wb: qa(37), ws: qa(33), wt: qa(15), h: qa(152), hs: qa(128), th: Math.max(5, qa(9.4)) }, Pp = 2 * D.wb + qa(18), ph = qa(24), ya = yB - ph;
    this.arches = [-1, 0, 1].map(i => ({ cx: cx0 + i * Pp, h: D.h + ph }));
    const A0 = this.arches, plx = [[A0[0].cx - D.wb - D.th * 1.3, A0[0].cx - D.wb + D.th * 1.3], [A0[0].cx + D.wb - D.th * 1.2, A0[1].cx - D.wb + D.th * 1.2], [A0[1].cx + D.wb - D.th * 1.2, A0[2].cx - D.wb + D.th * 1.2], [A0[2].cx + D.wb - D.th * 1.3, A0[2].cx + D.wb + D.th * 1.3]];
    for (const a of A0) this.arch(R, a.cx, ya, D);
    this.plinths = plx.map(([a, b]) => { this.plinth(R, a, b, ya, yB); return { x0: a, x1: b, top: ya }; });
    this.lampPost(R, this.X(mob ? 0.18 : 0.3), yB + q(4), qa(62), 1); this.lampPost(R, this.X(0.95), yB + q(4), qa(62), -1);
    this.bench(R, this.X(0.12), yB + q(10), q(30));
    this.tree(R, this.X(0.02), Math.round(PH * 0.82), 1.7); this.tree(R, this.X(0.99), Math.round(PH * 0.8), 1.8);
    { const [sc2, sx2] = this.mk(FW, PH), S = this.painter(sx2), k = this.A * 1.45, U = v => Math.max(1, Math.round(v * k)), sx = Math.round(cx0), sb = yB + q(26); this.Ls = sc2; this.stY = sb;
      const y0 = sb + U(3);
      for (let y = y0; y < PH; y++) { const d = y - y0, hs = U(6) + d * 0.1, hg = hs + U(3) + d * 0.04, hl = hg + qa(40) + d * 0.32;
        for (let xx = Math.round(-hl); xx <= hl; xx++) { const ax = Math.abs(xx), X2 = sx + xx, b2 = this.bay(X2, y); let col;
          if (ax <= hs) { const tr = Math.floor(d / U(4)), tc = Math.floor((xx + hs) / Math.max(2, hs / 2)), hh = Math.abs(Math.sin(tr * 9.1 + tc * 3.7) * 4375.85) % 1; col = d % U(4) === 0 || Math.abs(Math.round(xx + hs) % Math.max(2, Math.round(hs / 2))) === 0 ? '#6a6474' : hh < 0.33 ? '#8a8494' : hh < 0.66 ? '#9a94a4' : '#7e788a'; }
          else if (ax <= hs + 1) col = '#4a4452'; else if (ax <= hg) col = b2 < 0.35 ? '#e4dee4' : '#f6f2f2'; else if (ax <= hg + 1) col = '#8a7a86';
          else { const gv = d / (PH - y0) * 0.8 + (b2 - 0.5) * 0.5; col = ax > hl - 1 ? '#e8d4c8' : gv < 0.25 ? '#7e9a52' : gv < 0.55 ? '#668a4a' : '#527a42'; }
          R(X2, y, 1, 1, col); } }
      const qx0 = sx - U(25), qx1 = sx + U(25), qy0 = sb - U(10), qy1 = sb + U(3);
      for (let y = qy0; y < qy1; y++) for (let xx = qx0; xx < qx1; xx++) S(xx, y, 1, 1, y === qy0 || y === qy1 - 1 || xx === qx0 || xx === qx1 - 1 ? '#f6eee8' : this.bay(xx, y) < 0.3 ? '#d4bcb4' : '#dec6bc');
      for (let xx = qx0; xx < qx1; xx += 2) if (Math.abs(xx - sx) > U(4)) { S(xx, qy0 - U(3), 1, U(3), '#f4f0ec'); } S(qx0, qy0 - U(2), Math.round((qx1 - qx0) / 2 - U(4)), 1, '#f4f0ec'); S(sx + U(4), qy0 - U(2), Math.round((qx1 - qx0) / 2 - U(4)), 1, '#f4f0ec');
      const hedge = (x0, x1, y, h) => { for (let yy = 0; yy < h; yy++) for (let xx = x0; xx < x1; xx++) { const l = (yy === 0 ? 0.6 : 0) + (this.bay(xx, y + yy) - 0.5) * 0.6 - yy / h * 0.4; S(xx, y + yy, 1, 1, l > 0.35 ? '#8ab05a' : l > -0.05 ? '#5a8a48' : '#3e6a3e'); } };
      hedge(qx0 + U(3), qx1 - U(3), qy0 + U(1), U(3)); hedge(qx0 + U(3), sx - U(14), qy0 + U(4), U(5)); hedge(sx + U(14), qx1 - U(3), qy0 + U(4), U(5));
      const tier = (hw, y1, h, top, front, side) => { S(sx - hw, y1 - h, hw * 2, h, front); S(sx - hw, y1 - h, hw * 2, Math.max(1, Math.round(h * 0.35)), top); S(sx + hw - 2, y1 - h, 2, h, side); S(sx - hw, y1 - h, hw * 2, 1, '#f09a80'); };
      tier(U(14), sb, U(4), '#c4604e', '#94302a', '#6a2220'); tier(U(10), sb - U(4), U(2.5), '#cc6a56', '#9c3a30', '#702620');
      const pw = U(15), ph = U(19), px0 = Math.round(sx - pw / 2), pt = sb - U(6.5) - ph;
      for (let yy = 0; yy < ph; yy++) for (let xx = 0; xx < pw; xx++) { const f = xx / (pw - 1), nz = this.vn(xx * 0.7 + 5, yy * 0.7), sp = (((xx * 73856093) ^ (yy * 19349663)) & 255) / 255; let col = this.mixc('#c25a4a', '#7e2a26', Math.pow(f, 1.2)); col = this.mixc(col, nz > 0.55 ? '#e08a74' : '#6a2420', Math.abs(nz - 0.5) * 0.45); if (sp > 0.93) col = this.mixc(col, '#f4b49a', 0.4); if (xx === 0) col = '#e07a66'; else if (xx === pw - 1) col = '#5a1c1a'; else if (xx === pw - 2) col = this.mixc(col, '#3a1010', 0.3); if (yy < 2) col = yy ? '#d8806a' : '#f6aa92'; if (yy >= ph - 2) col = yy === ph - 1 ? '#561a18' : '#7a2622'; S(px0 + xx, pt + yy, 1, 1, col); }
      const gold = (cx, y1, y2) => { const ch = Math.max(5, U(3.4)); for (let yy = y1; yy + ch <= y2; yy += ch + 1) { const hs = Math.abs(Math.sin((cx * 7 + yy) * 12.9898) * 43758.5453) % 1; const gx = cx - 1; for (let k = 0; k < 3; k++) if (((hs * 8 + k) | 0) % 2 === 0 || k === 1) { S(gx, yy + 1 + k * 2, 4, 1, '#8a6420'); S(gx - 0, yy + k * 2, 4, 1, '#f0cc70'); } S(gx + (hs > 0.5 ? 0 : 2), yy, 1, ch - 1, '#f0cc70'); S(gx + (hs > 0.5 ? 1 : 3), yy + 1, 1, ch - 1, '#8a6420'); } };
      gold(px0 + U(9.5), pt + U(2.5), pt + U(8), 0.7); gold(px0 + U(5), pt + U(2.5), pt + U(15), 0.6); gold(px0 + U(9.5), pt + U(11), pt + U(15.5), 0.5);
      S(sx - U(7.5), pt - U(2.5), U(15), U(2.5), '#3a302c'); S(sx - U(7.5), pt - U(2.5), U(15), 1, '#a08068'); S(sx - U(6), pt - U(3.2), U(12), 1, '#5a4c42');
      const fb = pt - U(3), rows = U(46);
      for (let r2 = 0; r2 < rows; r2++) { const v = r2 / k; let l, rg;
        if (v < 1.4) { l = -3.4; rg = 3.8; } else if (v < 7) { l = -2.6; rg = 2.8; }
        else if (v < 33) { const f = (v - 7) / 26; l = -4.8 - (1 - f) * 0.7 + (v > 18 && v < 30 ? 0.0 : 0); rg = 4.4 + Math.pow(1 - f, 1.5) * 5.2; }
        else if (v < 35.5) { const f = (v - 33) / 2.5; l = -5.6 + f * 1.2; rg = 5.6 - f * 1.2; }
        else if (v < 37) { l = -2.2; rg = 2.2; } else if (v < 37.8) { l = -1.4; rg = 1.4; }
        else if (v < 45) { const d = (v - 41.4) / 3.6, hw = 3.2 * Math.sqrt(Math.max(0, 1 - d * d)); l = -hw; rg = hw; } else continue;
        const y = fb - r2, a = Math.round(sx + l * k), b = Math.round(sx + rg * k);
        for (let xx = a; xx <= b; xx++) { const fr = (xx - a) / Math.max(1, b - a), rx = (xx - sx) / k; let col = this.mixc('#3a3028', '#7e6a56', Math.min(1, Math.pow(fr, 1.3) * 1.25)); { const fold = Math.sin(rx * 2.8 + v * 0.07) * 0.5 + 0.5; if (v < 33 && v > 5) col = this.mixc(col, '#241c18', fold * 0.3); if (fr > 0.86) col = this.mixc(col, '#e6ae78', Math.min(1, (fr - 0.86) / 0.12)); if (fr < 0.08) col = '#221c18'; }
          if (v < 1.4) col = fr > 0.7 ? '#6a5a4c' : '#201a16';
          else if (v < 7) { if (Math.abs(rx) < 0.5) col = '#201a16'; }
          else if (v < 33) { if (Math.abs(rx + 3.5) < 0.45 && v > 17 && v < 31) col = '#3a302a'; if (Math.abs(rx - 3.2) < 0.45 && v > 17 && v < 30) col = '#3a302a'; if (Math.abs(rx - 0.4) < 0.4 && v < 30) col = '#36302a'; if (v < 14 && Math.abs(rx - 0.4) < 1.2) col = '#3e342c'; if (v > 28 && v < 33 && Math.abs(rx + 0.6 - (v - 28) * 0.35) < 0.5) col = '#9a8470'; if (v > 28 && v < 33 && Math.abs(rx - 1.4 + (v - 28) * 0.35) < 0.5) col = '#9a8470'; }
          else if (v < 37) { if (Math.abs(rx) < 1) col = '#8a7664'; }
          else if (v >= 37.8) { const hy = v - 41.4; if (hy > 1.6 || (hy > 0.4 && Math.abs(rx) > 2)) col = fr > 0.75 ? '#5a4a40' : '#2a221e'; else if (Math.abs(rx + 0.4) < 1.2 && hy < 0.6 && hy > -2.6) col = '#8a765e'; if (Math.abs(Math.abs(rx) - 3.1) < 0.4 && hy < 0.6 && hy > -1.2) col = '#5a4a40'; }
          S(xx, y, 1, 1, col); } }
      hedge(qx0 + U(3), sx - U(14), sb - U(1), U(3)); hedge(sx + U(14), qx1 - U(3), sb - U(1), U(3)); }
    for (let yy = Math.round(PH * 0.8); yy < PH; yy++) { const f = (yy - PH * 0.8) / (PH * 0.2); for (let xx = 0; xx < FW; xx++) R(xx, yy, 1, 1, 'rgba(74,58,110,' + (f * f * 0.5) + ')'); }
  }

  buildFx() {
    const { FW, PH, q, qa, yB, X, cx0, base } = this, r = this.rng(7);
    this.clouds = Array.from({ length: 5 }, () => ({ x: r() * (FW + 80), y: q(30 + r() * 80), w: q(34 + r() * 40), h: q(5 + r() * 5), v: (1.5 + r() * 2.4) * this.u }));
    this.birds = Array.from({ length: this.mob ? 4 : 7 }, (_, i) => ({ x: -r() * 80, y: q(70 + r() * 40) + i * 3, v: (9 + r() * 3) * this.u, ph: r() * 6 }));
    this.leaves = Array.from({ length: this.mob ? 8 : 14 }, () => this.newLeaf(true));
    this.bf = [[cx0 - qa(60), yB - qa(30), '#ffd860'], [cx0 + qa(90), yB - qa(22), '#ff9ac0'], [X(0.08), yB + q(4), '#fff0a0'], [X(0.95), yB - q(4), '#ff9ac0']].map(([x, y, c], i) => ({ x, y, c, ph: i * 1.9 }));
    const P = {
      orange: { b: '#e8923a', d: '#b8661e', l: '#ffd090', n: '#f08a8a', eye: '#2a1a1a', patch: (a, b) => (Math.round(a / 2) + Math.round(b / 2)) % 3 === 0 ? { b: '#b8661e', d: '#8a4a14', l: '#e8923a' } : null },
      gray: { b: '#8e8ca4', d: '#605e7c', l: '#d4d2e4', n: '#f09aa0', eye: '#2a1a1a', patch: (a, b) => (Math.round(a / 2)) % 3 === 0 ? { b: '#6a6884', d: '#4c4a68', l: '#9896b0' } : null },
      black: { b: '#34303e', d: '#1c1824', l: '#7a7490', n: '#a86a78', eye: '#f4c030' },
      white: { b: '#f6f0ea', d: '#cdbfd2', l: '#ffffff', n: '#f09aa0', eye: '#2a1a1a' },
      calico: { b: '#f6f0ea', d: '#cdbfd2', l: '#ffffff', n: '#f09aa0', eye: '#2a1a1a', patch: (a, b) => { const v = Math.sin(a * 0.9 + 1) + Math.cos(b * 0.8); return v > 1.1 ? { b: '#e8923a', d: '#b8661e', l: '#ffc070' } : v < -1.1 ? { b: '#34303e', d: '#1c1824', l: '#7a7490' } : null; } },
      golden: { b: '#e0b060', d: '#a8782e', l: '#ffe4a8', n: '#2a1e22', eye: '#2a1a1a', ear: '#a8782e' },
      brown: { b: '#a86e44', d: '#744626', l: '#e8c8a8', n: '#2a1e22', eye: '#2a1a1a', ear: '#5a3418', patch: (a, b) => b < 5 ? { b: '#f6f0ea', d: '#cdbfd2', l: '#ffffff' } : null },
      tan: { b: '#2e2a36', d: '#18141e', l: '#6a6482', n: '#14101a', eye: '#2a1a1a', ear: '#18141e', patch: (a, b) => b < 3.4 || (Math.abs(a - 12) < 2.4 && b > 12) ? { b: '#b87840', d: '#8a5428', l: '#e8a868' } : null }
    };
    const pl = this.plinths, yF = yB, mid = k => (pl[k].x0 + pl[k].x1) / 2;
    this.pets = [
      { kind: 'cat', pose: 'sit', pal: P.orange, x: mid(1), y: pl[1].top, f: -1, sc: 0.66 },
      { kind: 'cat', pose: 'loaf', pal: P.gray, x: mid(3), y: pl[3].top, f: -1, sc: 0.66, zz: 1 },
      { kind: 'cat', pose: 'sit', pal: P.black, x: cx0 + qa(52), y: yF + q(10), f: -1, sc: 0.66 },
      { kind: 'cat', pose: 'groom', pal: P.calico, x: X(0.12) + 4, y: yB + q(10), f: 1, sc: 0.66 },
      { kind: 'cat', pose: 'loaf', pal: P.white, x: X(0.93), y: yB + q(6), f: -1, sc: 0.66, zz: 1 },
      { kind: 'cat', kit: 1, pose: 'sit', pal: P.orange, x: X(0.34), y: yF + q(18), f: 1, sc: 0.4 },
      { kind: 'cat', kit: 1, pose: 'sit', pal: P.calico, x: X(0.34) + qa(12), y: yF + q(19), f: -1, sc: 0.38 },
      { kind: 'dog', role: 'fetch', pose: 'lie', pal: P.golden, x: cx0 - qa(124), y: yF + q(15), f: 1, sc: 1 },
      { kind: 'dog', role: 'wander', pose: 'sit', pal: P.brown, x: cx0 + qa(132), y: yF + q(19), f: -1, sc: 0.95 },
      { kind: 'dog', role: 'sniff', pose: 'stand', pal: P.tan, x: X(0.22), y: yF + q(12), f: 1, sc: 0.92 }
    ].map((p, i) => Object.assign(p, { ph: i * 1.37, ex: -9, hx: p.x, gait: 0, yo: 0 }));
    const g = this.pets.find(p => p.role === 'fetch'); this.ball = { x: g.x + qa(40), h: 0, vx: 0, vy: 0, gy: g.y, lo: g.x - qa(60), hi: g.x + qa(85) }; this.barks = [];
  }
  newLeaf(any) { const { FW, PH } = this, r = Math.random; return { x: r() * FW, y: any ? r() * PH * 0.7 : -4, ph: r() * 6, v: (6 + r() * 6) * this.u, c: ['#e8b040', '#d8803a', '#c85a30', '#e8d070'][Math.floor(r() * 4)] }; }

  /* ---------- pets ---------- */
  E(cx, cy, rx, ry, pal, o) {
    const { R, s, f, x0, y0, sd } = this._pc, X0 = x0 + f * cx * s, Y0 = y0 - cy * s, rxp = Math.max(1, rx * s), ryp = Math.max(1, ry * s);
    for (let yy = -Math.ceil(ryp); yy <= Math.ceil(ryp); yy++) for (let xx = -Math.ceil(rxp); xx <= Math.ceil(rxp); xx++) {
      const dx = xx / rxp, dy = yy / ryp; if (dx * dx + dy * dy > 1) continue;
      const px = Math.round(X0 + xx), py = Math.round(Y0 + yy), l = dx * sd * 0.8 - dy * 0.75 + (this.bay(px, py) - 0.5) * 0.45;
      let C = pal; if (!(o && o.flat) && pal.patch) { const pc = pal.patch(cx + f * xx / s, cy - yy / s); if (pc) C = pc; }
      R(px, py, 1, 1, o && o.col ? o.col : l > 0.72 ? C.l : l > -0.12 ? C.b : C.d);
    }
  }
  Rc(cx, cy, w, h, col) { const { R, s, f, x0, y0 } = this._pc, a = x0 + f * cx * s, b = x0 + f * (cx + w) * s; R(Math.min(a, b), y0 - (cy + h) * s, Math.max(1, Math.abs(b - a)), Math.max(1, h * s), col); }
  Pt(cx, cy, col, w = 1, h = 1) { const { R, s, f, x0, y0 } = this._pc; R(x0 + f * cx * s - (f < 0 ? Math.max(1, Math.round(w * s)) - 1 : 0), y0 - cy * s, Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)), col); }
  Tri(a, b, c, col) { const { R, s, f, x0, y0 } = this._pc, P = [a, b, c].map(([x, y]) => [x0 + f * x * s, y0 - y * s]), mnx = Math.floor(Math.min(P[0][0], P[1][0], P[2][0])), mxx = Math.ceil(Math.max(P[0][0], P[1][0], P[2][0])), mny = Math.floor(Math.min(P[0][1], P[1][1], P[2][1])), mxy = Math.ceil(Math.max(P[0][1], P[1][1], P[2][1]));
    const sg = (p1, p2, p3) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
    for (let yy = mny; yy <= mxy; yy++) for (let xx = mnx; xx <= mxx; xx++) { const q = [xx + 0.5, yy + 0.5], d1 = sg(q, P[0], P[1]), d2 = sg(q, P[1], P[2]), d3 = sg(q, P[2], P[0]); if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) R(xx, yy, 1, 1, col); } }
  Tail(pts, th, pal, tip) { const { R, s, f, x0, y0 } = this._pc, w = Math.max(1, Math.round(th * s)); pts.forEach(([a, b], i) => R(x0 + f * a * s - w / 2, y0 - b * s - w / 2, w, w, tip && i > pts.length - 3 ? tip : i % 2 && pal.patch ? pal.d : pal.b)); }
  bez(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const u = i / n, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u; o.push([a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]); } return o; }

  SP(rows, ox, yTop, pal, eo) {
    const { R, f, x0, y0 } = this._pc, u = this._u, cat = eo.cat, br = hx => { const n = parseInt(hx.slice(1), 16); return ((n >> 16) + ((n >> 8) & 255) + (n & 255)) / 3; };
    const OL = br(pal.b) < 70 ? '#0c0812' : '#2c1e2e', EC = '#1c1420', PC = pal.pc || (pal.b === '#a86e44' ? '#f4eee8' : pal.b === '#2e2a36' ? '#b87840' : pal.b === '#f6f0ea' && pal.patch ? '#e8923a' : (pal.b === '#e8923a' || pal.b === '#8e8ca4') ? pal.d : pal.b);
    const eyeC = br(pal.b) < 70 ? '#f0c040' : cat && pal.eye !== '#2a1a1a' ? pal.eye : EC;
    rows.forEach((row, r) => { for (let c = 0; c < row.length; c++) { const ch = row[c]; if (ch === '.') continue;
      const up = r ? rows[r - 1][c] : '.', dn = r < rows.length - 1 ? rows[r + 1][c] : '.'; let col;
      switch (ch) {
        case 'o': col = OL; break; case 'b': col = up === 'o' ? pal.l : dn === 'o' ? pal.d : pal.b; break; case 'l': col = pal.l; break; case 'd': col = pal.d; break;
        case 'n': col = pal.n; break; case 'p': col = '#f4a0a8'; break; case 'm': col = PC; break; case 'a': col = cat ? '#f4a8b0' : (pal.ear || pal.d); break;
        case 'k': col = '#f6eef0'; break; case 'w': col = eo.blink ? pal.b : '#ffffff'; break; case 'e': col = eo.blink ? pal.b : eyeC; break; case 'E': col = eyeC; break; default: col = pal.b; }
      const cx = ox + c, a = Math.round(cx * u), b = Math.round((cx + 1) * u), ya = Math.round((yTop - r) * u), yb = Math.round((yTop - r - 1) * u);
      R(f > 0 ? x0 + a : x0 - b, y0 - ya, Math.max(1, b - a), Math.max(1, ya - yb), col); } });
  }
  tail(pts, th, pal) { const OL = '#2c1e2e'; this.Tail(pts, th + 1.6, { b: OL, d: OL, l: OL }); this.Tail(pts, th, pal); }
  pet(p) {
    const t = this.t, ph = p.ph, s = this.ps * p.sc * this.dep(p.y), wag = t < p.ex ? 14 : 6; p._wag = wag;
    const cat = p.kind === 'cat', u = s * (cat ? 0.5 : 0.46);
    this._pc = { R: this.R, s: u, f: p.f, x0: Math.round(p.x), y0: Math.round(p.y - (p.yo || 0)), sd: this.sunX > p.x ? 1 : -1 }; this._u = u;
    const x0 = this._pc.x0, y0 = this._pc.y0, wv = Math.sin(t * wag + ph), sw = Math.sin(t * 1.6 + ph), pal = p.pal, blink = ((t * 0.7 + ph) % 4) < 0.14;
    if (!this._sp) {
      const M = (h, pad) => h.map(r => { const a = (pad || '') + r; return a + [...a].reverse().join(''); });
      const ch = ['...oo.......', '..oaao......', '..oaaao.....', '.oaaabo.....', '.oaabbbo....', '.obbbbbbooo.', 'obbbbbbbbbbb', 'obbbbbbbbmbb', 'obbbbbbbbbmb', 'obbeeeebbbbb', 'obbeweebbbbb', 'obbEEEEbbbbb', 'obbeeeebbbbb', 'obbbeeebbbbb', 'obppbbbbbbnn', 'obppbbbbbbdn', 'obbbbbbbbddb', 'obbbbbbbbbbd', '.obbbbbbbbbb', '..oooooooooo'].map(r => r.padEnd(12, 'b').slice(0, 12));
      const fx = (a, n) => a.map(r => r.padEnd(n, 'b').slice(0, n));
      this._sp = {
        CH: M(ch.map((r, i) => (i === 15 || i === 16 ? 'kk' : '..') + r)),
        CB: M(fx(['...obbbbbb', '..obbbbbbb', '.obbbbbbbl', '.obbbbbbll', 'obbbbbbbll', 'obbbbbbbll', 'obbbbmbbbl', 'obbbbbbbbb', 'obbbbbblll', 'obbbbldldo', 'oooooooooo'], 10)),
        LB: M(fx(['.....ooooooo', '...oobbbbbbb', '..obbbbbbbbb', '.obbbbbbbbbb', '.obbbbbmbbbb', 'obbbbbbmmbbb', 'obbbbbbbbbbb', 'obbbbbbbbbbb', 'obllbbbbbbbb', 'oooooooooooo'], 12)),
        DH: M(fx(['....oooooooo', '..oooobbbbbb', '.oaaaobbbbbb', 'oaaaaobbbbbb', 'oaaaaobbbbmm', 'oaaaaobbbbmm', 'oaaaaobeeebm', 'oaaaaobewebm', 'oaaaaobEEEbm', 'oaaaaobeeebm', 'oaaaaobppbbm', 'oaaaaobppbll', '.oaaaobblnnn', '.oaaaobblnnn', '..oaaobblldd', '...ooobblldd', '....oobbbbbb', '.....ooooooo'], 12)),
        DS: M(fx(['..obbbbbbbbb', '.obbbbbbbbbb', 'obbbbblllll', 'obbbbblllll', 'obbbbblllll', 'obbbbbbllll', 'obbbbbbllll', 'obbbbbbbbbb', 'obbbbbbbbbb', 'obbbbbbbbbb', 'obbbbbbbbbb', 'obbbbbbblll', 'obbbbllllll', 'ooolllllloo'], 12)),
        DB: M(fx(['....ooooooooooooo', '..oobbbbbbbbbbbbb', '.obbbbbbbbbbbbbbb', 'obbbbbbbbbbbbbbbb', 'obbbbbbbbbbbbbbbb', 'obbbbbbbmmmbbbbbb', 'obbbbbbmmmmbbbbbb', 'obbbbbbbbbbbbbbbb', '.obbbbbbbbbbbbbbb', '.obbbbblllllllllll', '..oobbbllllllllll', '....ooooooooooooo'], 17)),
        DL: M(fx(['.....ooooooooooo', '...oobbbbbbbbbbb', '..obbbbbbbbbbbbb', '.obbbbbbmmbbbbbb', 'obbbbbbbbbbbbbbb', 'obbbblllllllllll', 'oooooooooooooooo'], 16))
      };
    }
    const S = this._sp;
    if (cat) {
      if (p.pose === 'sit' || p.pose === 'groom') {
        const g = p.pose === 'groom', hb = Math.sin(t * 1.4 + ph) * 0.4;
        this.tail(this.bez([-10, 3], [-20, 2], [-17, 15 + 5 * sw], 12), 4, pal);
        this.SP(S.CB, -10, 11, pal, { cat: 1 }); this.SP(S.CH, -14, 27 + hb, pal, { cat: 1, blink: blink || g });
        if (g) { const b = Math.abs(Math.sin(t * 5 + ph)); this.Rc(7, 12 + b * 3, 7, 8, '#2c1e2e'); this.Rc(8, 13 + b * 3, 5, 6, pal.l); }
      } else {
        const br = Math.sin(t * 1.8 + ph) * 0.4;
        this.tail(this.bez([-14, 4], [-20, 2], [-18, 10], 10), 4, pal);
        this.SP(S.LB, -14, 10 + br, pal, { cat: 1 }); this.SP(S.CH, -2, 17, pal, { cat: 1, blink: blink || !!p.zz });
        if (p.zz) { p._zt = (p._zt || 0) - this.dtStep; if (p._zt <= 0) { p._zt = 2.4; this.parts.push({ k: 'z', x: x0 + p.f * 12 * u, y: y0 - 22 * u, vx: 3, vy: -6, life: 2.2, t0: t }); } }
      }
    } else if (p.pose === 'lie') {
      const hb = Math.sin(t * 0.8 + ph) * 0.4, wb = Math.abs(wv);
      this.tail([[-24, 3], [-27, 3 + wb], [-29, 5 + wb * 3]], 4, pal);
      this.SP(S.DL, -24, 9, pal, {}); this.SP(S.DH, -2, 18 + hb, pal, { blink: blink || ((t * 0.5 + ph) % 6) < 0.16 });
      for (const px of [1, 13]) { this.Rc(px, 0, 8, 5, '#2c1e2e'); this.Rc(px + 1, 1, 6, 3.4, pal.l); this.Rc(px + 3.4, 1, 1, 2.4, pal.d); }
    } else if (p.pose === 'sit') {
      const hb = Math.sin(t * 1.2 + ph) * 0.5, wb = Math.abs(wv);
      this.tail([[-12, 3], [-15, 2], [-17 + wv * 1.4, 3 + wb * 3], [-18 + wv * 3, 6 + wb * 4]], 4, pal);
      this.SP(S.DS, -12, 14, pal, {}); this.SP(S.DH, -12, 27 + hb, pal, { blink });
    } else {
      const g = p.gait || 0, a0 = t * 11 + ph, B = g * Math.abs(Math.sin(a0)) * 1.2, sn = p.sniff || 0, wb = Math.abs(wv);
      this.tail([[-22, 14 + B], [-26, 17 + B], [-28 + wv * 1.4, 22 + B + wb * 2], [-28 + wv * 3, 27 + B + wb * 3]], 4, pal);
      const leg = (lx, i, col, hl) => { const a = a0 + (i === 0 || i === 3 ? 0 : Math.PI), lift = g * Math.max(0, Math.sin(a)) * 4, dx = g * Math.cos(a) * 3; this.Rc(-22 + lx + dx, lift, 7, 9, '#2c1e2e'); this.Rc(-21 + lx + dx, lift + 1, 5, 8, col); if (hl) { this.Rc(-21 + lx + dx, lift + 1, 5, 2, pal.l); } };
      leg(4, 1, pal.d, 0); leg(9, 2, pal.d, 0); leg(22, 1, pal.d, 0);
      this.SP(S.DB, -22, 22 + B, pal, {});
      leg(7, 0, pal.b, 1); leg(25, 3, pal.b, 1); leg(11, 2, pal.b, 1);
      const hb = Math.sin(t * 0.7 + ph) * 1 - 1 * Math.max(0, Math.sin(t * 0.35 + ph)) - 6 * sn + B * 0.5;
      this.SP(S.DH, -2, 33 + hb + B * 0.3, pal, { blink });
      if (g > 0.4) { const tl = 2 + Math.abs(Math.sin(t * 14)) * 2; this.Rc(7.4, 33 + hb - 15 - tl, 5, tl + 1, '#2c1e2e'); this.Rc(8.4, 33 + hb - 15 - tl + 1, 3, tl, '#ee6a7a'); }
    }
  }
  stepPets(dt) {
    const u = this.u, t = this.t, b = this.ball;
    if (b) { b.x += b.vx * dt; b.h += b.vy * dt; b.vy -= 140 * u * dt; if (b.h <= 0) { b.h = 0; if (b.vy < -10 * u) { b.vy = -b.vy * 0.55; b.vx *= 0.85; } else b.vy = 0; } if (b.h === 0) b.vx *= Math.max(0, 1 - 1.4 * dt); if (b.x < b.lo) { b.x = b.lo; b.vx = Math.abs(b.vx) * 0.6; } if (b.x > b.hi) { b.x = b.hi; b.vx = -Math.abs(b.vx) * 0.6; } }
    this.barks = this.barks.filter(k => t - k.t0 < 1.3);
    for (const p of this.pets) {
      if (p.kind === 'cat') { if (p.kit) { p.kt = (p.kt == null ? p.ph : p.kt) - dt; if (p.kt <= 0) { p.kt = 2.5 + Math.random() * 3; p.hopT = t; } const a = t - (p.hopT || -9); p.yo = a < 0.5 ? Math.sin(a / 0.5 * Math.PI) * 5 * this.ps * p.sc : 0; } continue; }
      const mv = (tx, sp) => { const d = tx - p.x; if (Math.abs(d) > 1.5) { p.x += Math.sign(d) * Math.min(Math.abs(d), sp * dt); p.f = Math.sign(d); return true; } return false; };
      let moving = false;
      if (p.role === 'fetch') {
        p.rt = (p.rt || 0) - dt; p.kc = (p.kc || 0) - dt;
        if (p.st !== 'rest') { p.pose = 'stand'; moving = mv(b.x, 66 * u);
          if (Math.abs(p.x - b.x) < 6 * this.ps && p.kc <= 0) { const dir = (b.x - p.hx) > 0 ? -1 : 1; b.vx = (Math.random() < 0.72 ? dir : -dir) * (50 + Math.random() * 40) * u; b.vy = (45 + Math.random() * 25) * u; p.kc = 0.7; p.n = (p.n || 0) + 1; if (p.n >= 5) { p.n = 0; p.st = 'rest'; p.rt = 6; } } }
        else { p.pose = p.rt > 3.2 ? 'sit' : 'lie'; if (p.rt <= 0) { p.st = 'go'; p.pose = 'stand'; } }
        p.gt = moving ? 1 : 0;
      } else {
        p.wt = (p.wt == null ? 1 : p.wt) - dt; const walk = p.role === 'sniff';
        if (p.st === 'go') { moving = mv(p.tx, (walk ? 15 : 32) * u); p.pose = 'stand'; p.sniff = walk ? 1 : 0;
          if (!moving) { p.st = 'idle'; p.wt = walk ? 2 + Math.random() * 2 : 2.5 + Math.random() * 3; p.pose = walk ? 'stand' : 'sit'; p.sniff = 0; if (!walk && Math.random() < 0.6) { this.barks.push({ x: p.x + p.f * 14 * this.ps, y: p.y - 24 * this.ps, t0: t }); p.hopT = t; } } }
        else { p.pose = walk ? 'stand' : 'sit'; p.sniff = 0; if (p.wt <= 0) { p.st = 'go'; p.tx = p.hx + (Math.random() * 2 - 1) * this.qa(walk ? 70 : 45); } }
        p.gt = moving ? (walk ? 0.55 : 1) : 0;
        if (!walk) { const a = t - (p.hopT || -9); p.yo = a < 0.45 ? Math.sin(a / 0.45 * Math.PI) * 4 * this.ps : 0; }
      }
      p.gait = (p.gait || 0) + ((p.gt || 0) - (p.gait || 0)) * Math.min(1, dt * 8);
    }
  }
  drawBall(b) {
    const R = this.R, s = this.ps, r = Math.max(2, Math.round(2.4 * s)), x = Math.round(b.x), g = Math.round(b.gy), sd = this.sunX > b.x ? 1 : -1;
    R(x - r, g, r * 2, 1, '#5a4a7a'); const cy = Math.round(g - b.h - r);
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { if (xx * xx + yy * yy > r * r + r * 0.5) continue; const l = (xx / r) * sd * 0.8 - (yy / r) * 0.75; R(x + xx, cy + yy, 1, 1, Math.abs(yy + xx * 0.3) < 0.8 ? '#f6f0ea' : l > 0.6 ? '#ff9a8a' : l > -0.1 ? '#e8404a' : '#a82838'); }
  }
  dep(y) { return Math.max(0.8, Math.min(1.25, 0.85 + 0.4 * (y - (this.yB - this.q(22))) / this.q(60))); }
  butterfly(b) { const R = this.R, t = this.t, x = Math.round(b.x + Math.sin(t * 0.7 + b.ph) * this.qa(14)), y = Math.round(b.y + Math.sin(t * 1.1 + b.ph * 2) * this.qa(8)), w = Math.sin(t * 16 + b.ph) > 0 ? 2 : 1; R(x - w, y - 1, w, 2, b.c); R(x + 1, y - 1, w, 2, b.c); R(x, y - 1, 1, 3, '#2a1a2a'); }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.acc += dt; this.last = now; if (this.acc < 1 / 30 - 0.002) return;
    const step = this.acc * (this.props.speed ?? 1) * (this.reduce ? 0.3 : 1); this.acc = 0; this.t += step; this.dtStep = step;
    const par = (this.props.parallax ?? true) && !this.mob; this.mx += ((par ? this.mt : 0) - this.mx) * 0.08;
    const { FW, PH, u } = this;
    for (const c of this.clouds) { c.x += c.v * step; if (c.x - c.w > FW) c.x = -c.w * 1.5; }
    for (const b of this.birds) { b.x += b.v * step; if (b.x > FW + 10) b.x = -30 - Math.random() * 60; }
    for (const l of this.leaves) { l.y += l.v * step; l.x += (Math.sin(this.t * 1.2 + l.ph) * 6 + 2) * u * step; if (l.y > PH) Object.assign(l, this.newLeaf(false)); }
    for (let i = 0; i < 3; i++) this.hv[i] += ((this.hot === i ? 1 : 0) - this.hv[i]) * Math.min(1, step * 6);
    this.parts = this.parts.filter(p => { const a = this.t - p.t0; if (a > p.life) return false; p.x += p.vx * step; p.y += p.vy * step; if (p.k === 'leaf') p.vy += 30 * step; return true; });
    this.stepPets(step); this.draw();
  }
  cloud(cl, o0) {
    const R = this.R, x0 = Math.round(cl.x + o0), y0 = Math.round(cl.y), w = Math.round(cl.w), h = Math.round(cl.h);
    for (let yy = -h; yy <= h * 0.7; yy++) for (let xx = -w; xx <= w; xx++) { const nz = this.vn(xx * 0.05 + cl.w, yy * 0.3 + cl.h) * 0.5 + this.vn(xx * 0.18, yy * 0.5) * 0.2, d = Math.pow(xx / w, 2) + Math.pow(yy / (h * (yy < 0 ? 0.9 : 0.6)), 2) + (nz - 0.35) * 0.5; if (d > 1.05) continue; const a = d > 0.78 ? Math.max(0, (1.05 - d) / 0.27) : 1, v = yy / h + (nz - 0.35) * 0.5; R(x0 + xx, y0 + yy, 1, 1, v > 0.2 ? 'rgba(162,118,172,' + a + ')' : v > -0.35 ? 'rgba(232,134,156,' + a + ')' : 'rgba(255,184,150,' + a + ')'); }
  }
  bloom(a) {
    const { ctx: c, PW, PH } = this, w = Math.max(8, PW >> 2), h = Math.max(8, PH >> 2);
    if (!this.bc) { this.bc = document.createElement('canvas'); this.bc.width = w; this.bc.height = h; this.bx = this.bc.getContext('2d'); }
    const b = this.bx; b.globalCompositeOperation = 'copy'; b.filter = 'brightness(0.55) contrast(3) saturate(1.3) blur(1px)'; b.imageSmoothingEnabled = true; b.drawImage(c.canvas, 0, 0, w, h); b.filter = 'none';
    c.save(); c.imageSmoothingEnabled = true; c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.drawImage(this.bc, 0, 0, PW, PH); c.restore(); c.imageSmoothingEnabled = false;
  }
  leafFrame() {
    const { PW, PH, q } = this, [cv, x] = this.mk(PW, PH), R = this.painter(x), r = this.rng(55); this.gB = cv;
    const leaf = (cx, cy, rr, lit) => { for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr; xx <= rr; xx++) if (xx * xx + yy * yy <= rr * rr) { const l = (xx / rr) * lit * 0.7 - (yy / rr) * 0.5 + (this.bay(cx + xx, cy + yy) - 0.5) * 0.5; R(cx + xx, cy + yy, 1, 1, l > 0.5 ? '#d8d870' : l > 0.15 ? '#78a850' : l > -0.2 ? '#3e7a46' : '#244a38'); } };
    const br = (x0, y0, ang, len, th, d, lit) => { const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len; this.pl(R, x0, y0, x1, y1, Math.max(1, Math.round(th)), '#2a1c24'); const n = Math.max(3, Math.round(len / q(2.6))); for (let i = 1; i <= n; i++) { const t = i / n; if (r() < 0.95) leaf(Math.round(x0 + (x1 - x0) * t + (r() - 0.5) * q(8)), Math.round(y0 + (y1 - y0) * t + (r() - 0.5) * q(8)), Math.round(q(4 + r() * 5)), lit); } if (d > 0) for (let k = 0; k < 2; k++) br(x1, y1, ang + (r() - 0.5) * 1.4, len * (0.62 + r() * 0.15), th * 0.7, d - 1, lit); };
    br(-q(6), -q(6), 0.95, q(56), 4, 3, 1); br(-q(6), q(30), 0.5, q(38), 3, 2, 1); br(PW + q(6), -q(6), 2.2, q(52), 4, 3, -1); br(PW + q(6), q(26), 2.7, q(34), 3, 2, -1);
  }
  rays(o0) {
    const { ctx: c, q, gy, sunX, t, PH } = this, sx = sunX + o0, sy = gy - q(26), n = 11;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const a = Math.PI * (0.06 + 0.88 * i / (n - 1)) + Math.sin(t * 0.25 + i * 1.9) * 0.015, wd = 0.028 + 0.012 * Math.sin(i * 2.3 + 1), L = PH * 1.5, al = 0.04 + 0.02 * Math.sin(t * 0.7 + i * 1.7); const g = c.createLinearGradient(sx, sy, sx - Math.cos(a) * L, sy - Math.sin(a) * L * 0.0 + L * 0.0); c.fillStyle = 'rgba(255,205,140,' + al + ')'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a - wd) * L, sy - Math.sin(a - wd) * L); c.lineTo(sx + Math.cos(a + wd) * L, sy - Math.sin(a + wd) * L); c.closePath(); c.fill(); }
    c.restore();
  }
  draw() {
    const { ctx: c, M, t, mx, R } = this, o = k => Math.round(mx * k) - M, o0 = o(2), o1 = o(5);
    c.globalAlpha = 1; c.drawImage(this.L0, o0, 0);
    for (const cl of this.clouds) this.cloud(cl, o0);
    for (const b of this.birds) { const fl = Math.sin(t * 9 + b.ph) > 0 ? 1 : 0, bx = Math.round(b.x + o0), by = Math.round(b.y); R(bx, by + fl, 1, 1, '#2a2444'); R(bx + 1, by, 1, 1, '#2a2444'); R(bx + 2, by + fl, 1, 1, '#2a2444'); }
    c.drawImage(this.L1, o1, 0);
    { const gy = this.gy, q = this.q, g = c.createLinearGradient(0, gy - q(14), 0, gy + q(56)); g.addColorStop(0, 'rgba(255,200,170,0)'); g.addColorStop(0.3, 'rgba(255,204,176,0.26)'); g.addColorStop(1, 'rgba(255,204,176,0)'); c.fillStyle = g; c.fillRect(0, gy - q(14), this.PW, q(70)); }
    c.save(); c.translate(o1, 0);
    for (const l of this.lamps) this.blit(c, this.glow(l.r, '#ffc878'), l.x, l.y, 0.32 + 0.04 * Math.sin(t * 5 + l.x));
    const { arches, yB } = this;
    arches.forEach((a, i) => { const h = this.hv[i]; if (h < 0.02) return; this.blit(c, this.glow(this.qa(60 + a.h * 0.25), '#ffd080'), a.cx, yB - a.h * 0.5, 0.42 * h); const ay = yB - a.h - this.qa(14) - Math.round(Math.abs(Math.sin(t * 4)) * this.qa(4)); c.globalAlpha = h; for (let k = 0; k < 5; k++) R(a.cx - 4 + k, ay + k, 9 - 2 * k, 1, '#ffe27a'); c.globalAlpha = 1; });
    for (const b of this.bf) this.butterfly(b);
    const items = this.pets.map(p => ({ y: p.y, p })); items.push({ y: this.ball.gy, ball: 1 }); if (this.Ls) items.push({ y: this.stY, st: 1 }); items.sort((a, b) => a.y - b.y).forEach(d => d.st ? c.drawImage(this.Ls, 0, 0) : d.ball ? this.drawBall(this.ball) : this.pet(d.p));
    for (const p of this.parts) { c.globalAlpha = Math.max(0, 1 - (t - p.t0) / p.life);
      if (p.k === 'heart') { const rows = ['.#.#.', '#####', '.###.', '..#..']; rows.forEach((rw, j) => [...rw].forEach((ch, i) => { if (ch === '#') R(p.x + i, p.y + j, 1, 1, j === 0 && i < 2 ? '#ffb0c0' : '#ff5a7a'); })); }
      else if (p.k === 'z') { const z = Math.max(2, Math.round(this.ps * 2)); R(p.x, p.y, z + 1, 1, '#f4f0ff'); R(p.x + z - 1, p.y + 1, 1, 1, '#f4f0ff'); R(p.x + 1, p.y + z - 1, 1, 1, '#f4f0ff'); R(p.x, p.y + z, z + 1, 1, '#f4f0ff'); }
      else R(p.x, p.y, 2, 1, p.c); }
    c.globalAlpha = 1; c.restore();
    for (const l of this.leaves) R(l.x + o0, l.y, Math.sin(t * 3 + l.ph) > 0 ? 2 : 1, 1, l.c);
    if (!this.gB) this.leafFrame(); c.drawImage(this.gB, 0, 0);
    { const sy = this.gy - this.q(26), sx = this.sunX + o0, cx = this.PW / 2, cy = this.PH / 2; c.save(); c.globalCompositeOperation = 'lighter'; [[0.5, 6, '255,210,150', 0.09], [0.9, 10, '150,200,255', 0.06], [1.35, 4, '255,150,190', 0.08], [1.8, 14, '255,230,170', 0.05]].forEach(([k, rr, col, al]) => { const x = sx + (cx - sx) * k * 1.4, y = sy + (cy - sy) * k * 1.4, g = c.createRadialGradient(x, y, 0, x, y, this.q(rr)); g.addColorStop(0, 'rgba(' + col + ',' + al + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, this.q(rr), 0, 7); c.fill(); }); c.restore();
      if (!this.motes) this.motes = Array.from({ length: 46 }, (_, i) => ({ x: Math.random() * this.PW, y: this.gy - this.q(40) + Math.random() * this.q(120), v: 2 + Math.random() * 4, ph: Math.random() * 6 }));
      for (const m of this.motes) { m.x += Math.sin(t * 0.7 + m.ph) * 0.06 - 0.02; m.y -= m.v * 0.004; if (m.y < this.gy - this.q(50)) m.y = this.gy + this.q(70); const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + m.ph)); c.globalAlpha = a * 0.8; R(Math.round(m.x), Math.round(m.y), 1, 1, '#fff2c0'); } c.globalAlpha = 1; }
    this.rays(o0); this.bloom(0.3);
    this.drawText(o1);
  }
  drawText(o1) {
    const T = this.tctx, D = this.dpr, px = this.px, b = this.base; T.setTransform(D, 0, 0, D, 0, 0); T.clearRect(0, 0, this.W, this.H); T.textAlign = 'center'; T.textBaseline = 'middle';
    const mo = this.mono; if (mo) { const fs = Math.max(10, Math.round(mo.h * 0.36 * px)), X0 = (mo.x0 + o1) * px, W2 = mo.w * px, Y0 = mo.top * px, H2 = mo.h * px; T.fillStyle = '#d8c46c'; T.font = '700 ' + fs + 'px "STXingkai","Xingkai SC","STKaiti","KaiTi","Kaiti SC",cursive,serif'; T.textAlign = 'left'; T.fillText('数风流人物', X0 + W2 * 0.3, Y0 + H2 * 0.3); T.fillText('还看今朝', X0 + W2 * 0.08, Y0 + H2 * 0.7); T.font = '700 ' + Math.max(8, Math.round(fs * 0.45)) + 'px "STXingkai","Xingkai SC","STKaiti","KaiTi","Kaiti SC",cursive,serif'; T.fillText('毛泽东', X0 + W2 * 0.74, Y0 + H2 * 0.76); T.textAlign = 'center'; if (this.Ls) { T.save(); T.globalCompositeOperation = 'destination-out'; T.imageSmoothingEnabled = false; T.drawImage(this.Ls, o1 * px, 0, this.Ls.width * px, this.Ls.height * px); T.restore(); } }
    for (const k of this.barks) { const a = (this.t - k.t0) / 1.3; T.globalAlpha = Math.max(0, 1 - a * a); T.font = '800 ' + Math.max(12, Math.round(8 * this.ps * px)) + 'px "PingFang SC","Noto Sans SC",sans-serif'; T.lineWidth = 4; T.strokeStyle = '#3a2c5a'; T.lineJoin = 'round'; const tx = (k.x + o1) * px, ty = (k.y - a * 10) * px; T.strokeText('汪!', tx, ty); T.fillStyle = '#fff6e6'; T.fillText('汪!', tx, ty); }
    T.globalAlpha = 1;
  }
}

export function startScene(canvas, textCanvas, props) {
  const scene = new ProjectsScene(canvas, textCanvas, props);
  scene.mount();
  return scene;
}
