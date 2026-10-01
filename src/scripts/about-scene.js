/**
 * 关于我 — 逐像素绘制的赛博夜城屋顶露台场景（canvas 2D）
 *
 * 来源：AI 设计稿（dc 格式）中的 Component 类，外壳从 React/DCLogic 改写为原生 JS，
 * 内部绘制逻辑逐字保留，画面与原设计一致。
 *
 * 用法：import { startScene, iconURLs } from "@/scripts/about-scene";
 */

const PROPS = { pixelSize: 0, speed: 1, parallax: true };

export class AboutScene {
  props = { ...PROPS };
  t = 0; mx = 0; mt = 0; last = 0; acc = 0; parts = []; sp = { smoke: 0, spark: 0, steam: 0 }; flash = 0; nextFlash = 4; frameT = 0;
  BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  constructor(canvas, props) {
    this.canvasRef = { current: canvas };
    if (props) Object.assign(this.props, props);
  }

  mount() {
    this.reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.ctx = this.canvasRef.current.getContext('2d'); this.R = this.painter(this.ctx);
    this.build();
    this.resize = () => this.build();
    this.onMove = e => { this.mt = (e.clientX / window.innerWidth) * 2 - 1; };
    this.onVis = () => { this.hidden = document.hidden; this.last = performance.now(); };
    window.addEventListener('resize', this.resize); window.addEventListener('pointermove', this.onMove); document.addEventListener('visibilitychange', this.onVis);
    this.onDown = e => { const px = this.px || 2, x = e.clientX / px - (Math.round(this.mx * 4) - this.M), y = e.clientY / px; for (let i = 0; i < 10; i++) this.parts.push({ k: 'coin', x, y, vx: (Math.random() - 0.5) * 40, vy: -(18 + Math.random() * 30), life: 1.1, t0: this.t }); };
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
  disc(R, cx, cy, r, col) { r = Math.max(1, r); for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + r * 0.7) R(cx + xx, cy + yy, 1, 1, col); }

  build() {
    const c = this.canvasRef.current; if (!c) return;
    const W = Math.max(320, window.innerWidth || 0), H = Math.max(360, window.innerHeight || 0), mob = W < 700;
    const px = this.props.pixelSize > 0 ? Math.round(this.props.pixelSize) : Math.max(2, Math.round(H / 380));
    const PW = Math.ceil(W / px), PH = Math.ceil(H / px), u = PH / 360, M = 10, s = Math.min(u, PW / 560);
    Object.assign(this, { W, H, mob, px, PW, PH, u, M, s, FW: PW + 2 * M, glowC: {} });
    this.q = v => Math.round(v * u); this.qs = v => Math.max(1, Math.round(v * s));
    c.width = PW; c.height = PH; this.ctx.imageSmoothingEnabled = false; this.R = this.painter(this.ctx);
    this.gy = Math.round(PH * 0.62); this.yB = this.gy + this.q(30); this.X = f => M + Math.round(PW * f);
    this.wins = []; this.ants = []; this.bulbs = [];
    this.buildSky(); this.buildTerrace(); this.buildFx();
  }

  buildSky() {
    const { FW, PW, PH, M, gy, q } = this, [c, x] = this.mk(FW, PH), R = this.painter(x), r = this.rng(4); this.L0 = c;
    const [gc, gx] = this.mk(FW, gy + 2); this.gradImg(gx, FW, gy + 2, ['#080c1e', '#121838', '#20204c', '#372a5c', '#5a3466', '#8c4a6c', '#c46a70'], 1.15); x.drawImage(gc, 0, 0);
    this.blit(x, this.glow(q(130), '#ff7a8a'), M + PW * 0.5, gy - q(10), 0.28);
    const mx = M + Math.round(PW * (this.mob ? 0.5 : 0.62)), my = q(72), mr = Math.max(4, q(11));
    this.blit(x, this.glow(mr * 3, '#ffe8c0'), mx, my, 0.4);
    for (let yy = -mr; yy <= mr; yy++) for (let xx = -mr; xx <= mr; xx++) { const d = Math.hypot(xx, yy); if (d > mr) continue; if (Math.hypot(xx - mr * 0.5, yy + mr * 0.2) < mr * 0.88) continue; R(mx + xx, my + yy, 1, 1, d > mr - 1.5 ? '#f4dcae' : '#fff4d8'); }
    const L = [{ base: gy - q(4), lo: q(16), hi: q(60), col: '#251f4a', hi2: '#342c5e', win: 0, wc: [] }, { base: gy - q(1), lo: q(22), hi: q(90), col: '#181340', hi2: '#241c52', win: 0.16, wc: ['#8a6a8a', '#a8788a', '#5a8aaa'] }, { base: gy + 1, lo: q(20), hi: q(70), col: '#0f0b2a', hi2: '#1a1440', win: 0.28, wc: ['#f6c674', '#ffdca0', '#7ae0ff', '#e8842a'] }];
    for (const l of L) { let bx = -q(8); while (bx < FW) { const w = q(12 + r() * 26), h = Math.round(l.lo + r() * (l.hi - l.lo)), top = l.base - h;
      R(bx, top, w, gy + 2 - top, l.col); R(bx, top, w, 1, l.hi2); R(bx, top, 1, h, l.hi2);
      if (l.win) for (let wy = top + 4; wy < l.base - 3; wy += 4) for (let wx = bx + 3; wx < bx + w - 3; wx += 4) if (r() < l.win) R(wx, wy, 2, 2, l.wc[Math.floor(r() * l.wc.length)]);
      if (r() < 0.35) { const ax = bx + Math.round(w / 2); R(ax, top - q(10), 1, q(10), l.hi2); if (l.win) this.ants.push({ x: ax, y: top - q(10) }); }
      else if (r() < 0.4) R(bx + 2, top - q(3), Math.max(2, Math.round(w * 0.4)), q(3), l.hi2);
      bx += w + Math.floor(r() * 3); } }
  }

  buildTerrace() {
    const { FW, PW, PH, M, gy, yB, q, qs, X } = this, [c, x] = this.mk(FW, PH), R = this.painter(x), r = this.rng(12); this.L1 = c;
    const [gc, gx2] = this.mk(FW, PH - gy); this.gradImg(gx2, FW, PH - gy, ['#342c48', '#2b253c', '#221d33', '#181428'], 1.0); x.drawImage(gc, 0, gy);
    const vx = M + PW / 2, vy = gy - q(110);
    for (let i = -16; i <= 16; i++) { const bx = vx + i * q(54), k = (gy - vy) / (PH - vy), tx = vx + (bx - vx) * k; this.pl((a, b, w, h, col) => { if (this.bay(Math.round(a), Math.round(b)) < 0.75) R(a, b, w, h, col); }, tx, gy, bx, PH, 1, '#403858'); }
    for (let k = 1; k <= 8; k++) { const yy = Math.round(gy + (PH - gy) * Math.pow(k / 8, 1.9)); for (let xx = 0; xx < FW; xx++) if (this.bay(xx, yy) < 0.75) R(xx, yy, 1, 1, '#403858'); }
    const pt = gy - q(18);
    for (let yy = pt; yy < gy; yy++) { const row = Math.floor((yy - pt) / 4); for (let xx = 0; xx < FW; xx++) { const off = (row & 1) * 8; let col = '#3e3350'; if ((yy - pt) % 4 === 0 || (xx + off) % 16 === 0) col = '#2a2238'; else if ((yy - pt) < 3 && this.bay(xx, yy) < 0.5) col = '#4a3e60'; else if (yy > gy - 4 && this.bay(xx, yy) < 0.6) col = '#302840'; R(xx, yy, 1, 1, col); } }
    R(0, pt - 3, FW, 3, '#6a5c80'); R(0, pt - 3, FW, 1, '#8a7aa0'); R(0, pt, FW, 1, '#1a1428');
    for (let yy = gy; yy < gy + q(4); yy++) for (let xx = 0; xx < FW; xx++) if (this.bay(xx, yy) < 0.6 * (1 - (yy - gy) / q(4))) R(xx, yy, 1, 1, '#1a1528');
    this.stDesk(x, R); this.stBBQ(x, R); this.stArcade(x, R); this.stGym(x, R); this.stCam(x, R);
    const poles = [0.3, 0.585, 0.86], yT = gy - q(112), pts = [-M, ...poles.map(f => X(f)), FW + M];
    poles.forEach(f => { const px = X(f); R(px - 1, yT, 2, yB - yT, '#1e1a2c'); R(px - 3, yB - 2, 6, 2, '#2a2438'); R(px - 2, yT - 2, 4, 2, '#3a3450'); });
    const bcol = ['#ff7a5a', '#ffd25a', '#7ae0ff', '#c48aff'];
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(6, Math.round((b - a) / 3)), sag = q(10), y0 = i === 0 || i === pts.length - 2 ? yT - q(4) : yT;
      let pxp = a, pyp = y0; for (let j = 1; j <= n; j++) { const t = j / n, xx = a + (b - a) * t, yy = y0 + Math.sin(t * Math.PI) * sag; this.pl(R, pxp, pyp, xx, yy, 1, '#1a1428'); pxp = xx; pyp = yy; }
      const nb = Math.max(2, Math.round((b - a) / q(20))); for (let j = 1; j < nb; j++) { const t = j / nb; this.bulbs.push({ x: Math.round(a + (b - a) * t), y: Math.round(y0 + Math.sin(t * Math.PI) * sag) + 2, ph: r() * 6, c: bcol[(i * 3 + j) % 4] }); } }
  }

  stDesk(x, R) {
    const { yB, X, qs, s } = this, sx = X(0.045), xh = sx + qs(20), yT = yB - qs(28), dx0 = xh + qs(14), dW = qs(100);
    this.ds = { xh, dx0, yT };
    R(xh - qs(9), yB - qs(2), qs(18), qs(2), '#2a2436'); R(xh - qs(12), yB - qs(1), qs(3), qs(1), '#1a1626'); R(xh + qs(9), yB - qs(1), qs(3), qs(1), '#1a1626'); R(xh - 1, yB - qs(9), 2, qs(7), '#3a3450');
    R(xh - qs(9), yB - qs(12), qs(15), qs(3), '#262036'); R(xh - qs(9), yB - qs(12), qs(15), 1, '#c8283a');
    this.pl(R, xh - qs(7), yB - qs(11), xh - qs(9), yB - qs(46), qs(5), '#221c32'); this.pl(R, xh - qs(9) + 2, yB - qs(14), xh - qs(11) + 2, yB - qs(44), 1, '#c8283a'); R(xh - qs(13), yB - qs(53), qs(9), qs(6), '#2c2640'); R(xh - qs(13), yB - qs(53), qs(9), 1, '#c8283a');
    R(dx0, yT, dW, qs(3), '#5a3a2a'); R(dx0, yT, dW, 1, '#8a5a3a'); R(dx0, yT + qs(3), dW, 1, '#3a2418');
    R(dx0 + qs(3), yT + qs(3), qs(3), yB - yT - qs(3), '#3a2418'); R(dx0 + dW - qs(6), yT + qs(3), qs(3), yB - yT - qs(3), '#3a2418');
    R(dx0 + dW - qs(24), yT + qs(3), qs(20), qs(14), '#4a2e20'); R(dx0 + dW - qs(24), yT + qs(9), qs(20), 1, '#2a1810'); R(dx0 + dW - qs(15), yT + qs(6), qs(3), 1, '#c8a060'); R(dx0 + dW - qs(15), yT + qs(12), qs(3), 1, '#c8a060');
    const tw = qs(11), th = qs(22), tx = dx0 + qs(10); this.tower = { x: tx, y: yB - th - 1, w: tw, h: th };
    R(tx, yB - th - 1, tw, th, '#1a1626'); R(tx, yB - th - 1, tw, 1, '#3a3450'); R(tx + 1, yB - th, tw - 2, th - 2, '#0f0c1a');
    const mons = [{ cx: dx0 + qs(22), w: qs(24), h: qs(17), kind: 'term' }, { cx: dx0 + qs(52), w: qs(34), h: qs(23), kind: 'code' }, { cx: dx0 + qs(82), w: qs(24), h: qs(17), kind: 'rain' }];
    this.mons = mons.map(m => { const mm = { x: m.cx - (m.w >> 1), y: yT - qs(4) - m.h, w: m.w, h: m.h, kind: m.kind, cx: m.cx }; R(m.cx - 1, yT - qs(4), 2, qs(4), '#2a2436'); R(m.cx - qs(5), yT - 1, qs(10), 1, '#3a3450'); R(mm.x - 1, mm.y - 1, mm.w + 2, mm.h + 2, '#0c0a16'); R(mm.x - 1, mm.y - 1, mm.w + 2, 1, '#2a2440'); return mm; });
    R(dx0 + qs(6), yT - qs(2), qs(30), qs(2), '#241e34'); R(dx0 + qs(6), yT - qs(2), qs(30), 1, '#3a3450');
    R(dx0 + qs(90), yT - qs(2), qs(4), qs(2), '#241e34');
    const mg = dx0 + qs(64); R(mg - 100, 0, 0, 0, '#000');
    this.kb = { x: dx0 + qs(6), y: yT - qs(3), w: qs(30) };
    R(dx0 + qs(38), yT - qs(6), qs(5), qs(5), '#e8dcc8'); R(dx0 + qs(43), yT - qs(5), 1, qs(3), '#e8dcc8'); R(dx0 + qs(38), yT - qs(6), qs(5), 1, '#5a3a2a'); this.mug = { x: dx0 + qs(40), y: yT - qs(7) };
    const gp = dx0 + qs(90), gy2 = yT - qs(3); R(gp, gy2, qs(9), qs(3), '#3a3a4a'); R(gp, gy2, qs(9), 1, '#5a5a6e'); R(gp + 1, gy2 + 1, 2, 1, '#9a94a8'); R(gp + qs(6), gy2 + 1, 1, 1, '#e8284a'); R(gp + qs(7), gy2 + 1, 1, 1, '#f4c430');
    R(dx0 + dW - qs(2), yT - qs(9), 1, qs(9), '#2a2436'); R(dx0 + dW - qs(2) - 2, yT - qs(9), 5, 2, '#f4c430');
    this.coinP = [{ x: dx0 + qs(52), y: yT - qs(52), ph: 0 }];
  }

  stBBQ(x, R) {
    const { yB, X, qs, s } = this, gx = X(0.43), top = yB - qs(30), rad = qs(23), depth = qs(17);
    this.bbq = { gx, top, rad };
    R(gx - qs(16), top + qs(14), 2, yB - top - qs(14), '#2a2a34'); R(gx + qs(14), top + qs(14), 2, yB - top - qs(14), '#2a2a34'); R(gx - qs(16), yB - qs(10), qs(32), 2, '#3a3a48');
    this.disc(R, gx + qs(15), yB - 2, Math.max(2, qs(3)), '#1a1a22'); R(gx + qs(15), yB - 2, 1, 1, '#5a5a6a');
    for (let yy = 0; yy <= depth; yy++) { const hw = Math.round(rad * Math.sqrt(Math.max(0, 1 - Math.pow(yy / (depth + 1), 2))));
      for (let xx = -hw; xx <= hw; xx++) { const fr = (xx + hw) / Math.max(1, 2 * hw); let col = fr < 0.18 ? '#5a5a6c' : fr < 0.6 ? '#3a3a48' : fr < 0.82 ? '#2a2a36' : '#1a1a24'; if (this.bay(xx + 60, yy) < 0.12) col = '#4a4a5a'; R(gx + xx, top + yy, 1, 1, col); } }
    for (let xx = -rad; xx <= rad; xx++) { const ry = Math.round(qs(5) * Math.sqrt(Math.max(0, 1 - Math.pow(xx / rad, 2)))); R(gx + xx, top - ry, 1, ry * 2 + 1, '#1a0c0a'); R(gx + xx, top - ry, 1, 1, '#6a6a7c'); R(gx + xx, top + ry, 1, 1, '#4a4a5a'); }
    this.bbq.ry = qs(5);
    const sxp = gx + qs(28); R(sxp, top + qs(4), qs(20), 2, '#7a5230'); R(sxp, top + qs(4), qs(20), 1, '#a87840'); R(sxp + qs(2), top + qs(6), 2, yB - top - qs(6), '#5a3a20'); R(sxp + qs(16), top + qs(6), 2, yB - top - qs(6), '#5a3a20');
    R(sxp + qs(1), top + qs(2), qs(9), 2, '#e8e0d0'); for (let i = 0; i < 3; i++) { R(sxp + qs(1) + i * 2, top + qs(1) - (i & 1), 1, 1, '#c8a060'); R(sxp + qs(2) + i * 2, top + 1, 2, 1, '#8a4222'); }
    R(sxp + qs(13), top - qs(4), qs(3), qs(6), '#2a6a3a'); R(sxp + qs(13) + 1, top - qs(7), 1, qs(3), '#2a6a3a'); R(sxp + qs(13), top - qs(4), 1, qs(6), '#4a9a5a'); R(sxp + qs(13), top - qs(8), qs(3), 1, '#e8b840');
    this.coinP.push({ x: gx + qs(4), y: top - qs(64), ph: 1.3 });
  }

  stArcade(x, R) {
    const { yB, X, qs } = this, ax = X(0.53), H = qs(50), W = qs(24), y0 = yB - H;
    this.arc = { x: ax, y: y0, W, H };
    R(ax - W / 2, y0, W, H, '#231a4a'); R(ax - W / 2, y0, 2, H, '#3a2c70'); R(ax + W / 2 - 2, y0, 2, H, '#170f34');
    R(ax - W / 2, y0 - 1, W, qs(7), '#e8284a'); R(ax - W / 2, y0 - 1, W, 1, '#ff6a7a');
    for (let i = 0; i < 4; i++) R(ax - qs(8) + i * qs(5), y0 + qs(2), qs(3), qs(2), '#fff0a8');
    const sw = qs(18), sh = qs(16); R(ax - sw / 2 - 1, y0 + qs(9) - 1, sw + 2, sh + 2, '#0a0814'); this.scr = { x: ax - sw / 2, y: y0 + qs(9), w: sw, h: sh };
    R(ax - W / 2, y0 + qs(28), W, qs(6), '#3a2c7a'); R(ax - W / 2, y0 + qs(28), W, 1, '#5a4a9a');
    R(ax - qs(7), y0 + qs(26), 1, qs(3), '#9a94a8'); this.disc(R, ax - qs(7), y0 + qs(25), Math.max(1, qs(1.5)), '#e8284a');
    [['#f4c430', 2], ['#3ac8ff', 6], ['#e8284a', 10]].forEach(([c, o]) => R(ax + qs(o) - qs(3), y0 + qs(30), Math.max(2, qs(2)), Math.max(2, qs(2)), c));
    R(ax - W / 2 + 2, y0 + qs(36), W - 4, qs(14), '#1a1238'); R(ax - qs(4), y0 + qs(40), qs(8), qs(2), '#3a2c70');
    this.coinP.push({ x: ax, y: y0 - qs(14), ph: 2.4 });
  }

  stGym(x, R) {
    const { yB, X, qs } = this, lx = X(0.66);
    this.gym = { lx };
    R(lx - qs(38), yB - qs(2), qs(76), qs(4), '#14101e'); R(lx - qs(38), yB - qs(2), qs(76), 1, '#2a243a'); for (let i = 0; i < 9; i++) R(lx - qs(36) + i * qs(9), yB - qs(1), qs(4), 1, '#221c30');
    const bt = X(0.755); R(bt, yB - qs(40), 3, qs(40), '#2a2a34'); R(bt - qs(4), yB - 3, qs(12), 3, '#1a1a22');
    [[qs(9), '#c8283a', 12], [qs(19), '#2a2a36', 10], [qs(29), '#3a6ac8', 8], [qs(37), '#2a2a36', 7]].forEach(([yy, col, h]) => { R(bt + 3, yB - yy, qs(5), 1, '#5a5a6a'); R(bt + 4, yB - yy - qs(h) / 2 * 1, qs(3), qs(h), col); R(bt + 4, yB - yy - qs(h) / 2, 1, qs(h), '#ffffff22'); R(bt - qs(6), yB - yy - qs(h) / 2, qs(3), qs(h), col); });
    const rk = X(0.795), rw = qs(30);
    R(rk, yB - qs(22), 2, qs(22), '#2a2a34'); R(rk + rw - 2, yB - qs(22), 2, qs(22), '#2a2a34'); R(rk, yB - qs(22), rw, 2, '#3a3a48'); R(rk, yB - qs(11), rw, 2, '#3a3a48');
    const db = (cx, y, sz, col) => { R(cx - qs(5), y - 1, qs(10), 2, '#8a8a9a'); R(cx - qs(7), y - qs(sz) / 2, qs(3), qs(sz), col); R(cx + qs(4), y - qs(sz) / 2, qs(3), qs(sz), col); R(cx - qs(7), y - qs(sz) / 2, qs(3), 1, '#ffffff33'); };
    for (let i = 0; i < 3; i++) { db(rk + qs(8) + i * qs(7), yB - qs(23) - qs(1), 3 + i * 1.6, '#2a2a36'); db(rk + qs(8) + i * qs(7), yB - qs(12) - qs(1), 5 + i * 1.6, '#2a2a36'); }
    const kb = X(0.615); this.disc(R, kb, yB - qs(5), qs(4), '#2a2a36'); R(kb - qs(3), yB - qs(11), qs(6), 2, '#2a2a36'); R(kb - qs(2), yB - qs(9), 1, qs(3), '#2a2a36'); R(kb - qs(3), yB - qs(7), qs(2), 1, '#5a5a6e');
    R(X(0.63), yB - qs(9), qs(4), qs(9), '#3a6ac8'); R(X(0.63), yB - qs(11), qs(4), qs(2), '#e8e0d0'); R(X(0.63), yB - qs(9), 1, qs(9), '#7aa0e8');
    this.coinP.push({ x: lx, y: yB - qs(74), ph: 3.6 });
  }

  stCam(x, R) {
    const { yB, X, qs } = this, cx = X(0.92), apex = yB - qs(34);
    [[-14, 0], [14, 0], [3, 4]].forEach(([dx, dy], i) => this.pl(R, cx, apex, cx + qs(dx), yB + qs(dy), i === 2 ? 3 : 2, i === 2 ? '#3a3a48' : '#2a2a34'));
    R(cx - 1, apex - qs(5), 2, qs(5), '#4a4a5a'); R(cx - qs(4), apex - qs(7), qs(8), qs(2), '#3a3a4a');
    const bx = cx - qs(9), by = apex - qs(18), bw = qs(18), bh = qs(11);
    R(bx, by, bw, bh, '#1e1e28'); R(bx, by, bw, 1, '#4a4a5e'); R(bx, by + bh - 1, bw, 1, '#0e0e14'); R(bx + bw - qs(4), by + 1, qs(4), bh - 2, '#141420');
    R(bx + qs(9), by - qs(2), qs(6), qs(2), '#2a2a38'); R(bx + qs(2), by - qs(1), qs(3), qs(1), '#5a5a6e');
    R(bx - qs(8), by + qs(1), qs(8), qs(9), '#14141c'); R(bx - qs(8), by + qs(1), qs(8), 1, '#3a3a4a'); R(bx - qs(11), by + 1, qs(3), qs(9) + 2, '#0e0e14'); R(bx - qs(11), by + 2, 1, qs(9), '#5a8ac8'); R(bx - qs(7), by + qs(3), 1, qs(4), '#3a3a4a'); R(bx - qs(4), by + qs(3), 1, qs(4), '#3a3a4a');
    R(bx + bw, by + qs(2), qs(2), qs(7), '#2a2a3a'); R(bx + bw, by + qs(2), 1, qs(7), '#5a8ac8');
    this.cam = { lx: bx - qs(11), ly: by + qs(5), rx: bx + bw - qs(5), ry: by + qs(2), cx };
  }

  buildFx() {
    const { PW, PH, q, M, gy } = this, r = this.rng(9);
    this.stars = Array.from({ length: Math.round(PW * (gy) / 900) }, () => ({ x: M + r() * PW, y: r() * (gy - q(60)), ph: r() * 6, c: r() < 0.2 ? '#ffe0c0' : r() < 0.4 ? '#c0d8ff' : '#ffffff' }));
    this.drone = { x: this.X(0.6), y: gy - q(120) }; this.snap = 0;
  }

  human(o) {
    const R = this.R, k = o.k, f = o.f, X0 = o.x, Y0 = o.y, hip = o.hip, sh = o.sh, hd = o.head;
    const P = (a, b) => [Math.round(X0 + f * a * k), Math.round(Y0 - b * k)], th = v => Math.max(1, Math.round(v * k));
    const ik = (A, B, l1, l2, dir) => { let dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy); d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, d)); const ang = Math.atan2(dy, dx) + dir * Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))); return [A[0] + Math.cos(ang) * l1, A[1] + Math.sin(ang) * l1]; };
    const seg = (A, B, t, col) => { const a = P(A[0], A[1]), b = P(B[0], B[1]); this.pl(R, a[0], a[1], b[0], b[1], th(t), col); };
    const leg = (F, col) => { const J = ik(hip, F, 9.5, 9.5, 1); seg(hip, J, 4.8, col); seg(J, F, 4.2, col); const a = P(F[0] - 2.6, F[1] + 2.4), b = P(F[0] + 4.6, F[1] - 0.2), x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]), w = Math.abs(a[0] - b[0]), h = Math.abs(a[1] - b[1]) + 1; R(x0, y0, w, h, o.shoe); R(x0, y0 + h - 1, w, 1, '#e8e0d0'); };
    const arm = (Hd, dark) => { const J = ik(sh, Hd, 7.5, 7.5, -1); seg(sh, J, 3.8, dark ? o.armD : o.arm); seg(J, Hd, 3.3, dark ? o.foreD : o.fore); const h = P(Hd[0], Hd[1]), hs = th(2.8); R(h[0] - (hs >> 1), h[1] - (hs >> 1), hs, hs, dark ? '#dcb898' : o.skin); };
    leg(o.feet[1], o.pantD); arm(o.hands[1], true);
    const hp = P(hip[0], hip[1]), sp = P(sh[0], sh[1]);
    seg(hip, sh, 8.4, o.torsoD); this.pl(R, hp[0] + f, hp[1], sp[0] + f, sp[1], th(6.6), o.torso);
    if (o.extra) o.extra(P, seg, th);
    const nk = P(sh[0] + 0.6, sh[1] + 2); R(nk[0] - th(1.4), nk[1] - th(1.2), th(2.8), th(2.2), o.skin);
    leg(o.feet[0], o.pant);
    const [cx, cy] = P(hd[0], hd[1]), r = Math.round(4.6 * k);
    if (o.hood) this.disc(R, P(hd[0] - 1.8, hd[1] - 0.5)[0], P(hd[0] - 1.8, hd[1] - 0.5)[1], Math.round(5.6 * k), o.hood);
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { if (xx * xx + yy * yy > r * r + r * 0.6) continue; const nx = xx * f / r; let col = o.skin; if (yy < -r * 0.32 || nx < -0.2) col = o.hair; if (o.hood && (yy < -r * 0.55 || nx < -0.35)) col = o.hood; if (nx > 0.55 && yy > r * 0.3 && yy < r * 0.55) col = '#f0a8a0'; R(cx + xx, cy + yy, 1, 1, col); }
    R(cx + f * Math.round(r * 0.5), cy - 0, 1, Math.max(1, Math.round(k * 0.6)), '#20141a'); R(cx + f * r, cy + Math.round(r * 0.15), 1, 1, o.skin);
    if (o.cap) { R(cx - r, cy - r, r * 2 + 1, Math.round(r * 0.6), o.cap); R(cx - r, cy - r, r * 2 + 1, 1, '#ffffff33'); const bx = f > 0 ? cx + r - 1 : cx - r - Math.round(3.6 * k) + 1; R(bx, cy - Math.round(r * 0.5), Math.round(3.6 * k), Math.max(1, Math.round(k * 1.2)), o.cap); }
    if (o.band) { R(cx - r, cy - Math.round(r * 0.45), r * 2 + 1, Math.max(1, Math.round(k * 1.4)), o.band); const tl = f > 0 ? cx - r - 2 : cx + r + 1, w = Math.round(Math.sin(this.t * 6) * k * 0.8); R(tl, cy - Math.round(r * 0.35) + w, 2, Math.max(1, Math.round(k * 2.2)), o.band); }
    if (o.phones) { const px = cx - f * Math.round(r * 0.1); R(px - Math.round(k * 1.6), cy - Math.round(k * 1.2), Math.round(k * 3.2), Math.round(k * 4.4), o.phones); R(px - Math.round(k * 1.6), cy - Math.round(k * 1.2), Math.round(k * 3.2), 1, '#ffffff44'); for (let a = 200; a <= 340; a += 12) { const rr = r * 1.18; R(cx + Math.cos(a * Math.PI / 180) * rr, cy + Math.sin(a * Math.PI / 180) * rr * 0.95, 1, 1, o.phones); } }
    if (o.shades) { const ey = cy - Math.round(k * 0.2); R(cx + f * Math.round(r * 0.1) - (f > 0 ? 0 : Math.round(r * 0.9)), ey, Math.round(r * 0.9), Math.max(1, Math.round(k * 1.4)), '#101018'); }
    arm(o.hands[0], false);
  }

  screen(m) {
    const R = this.R, t = this.t, x = m.x, y = m.y, w = m.w, h = m.h, n = Math.floor((h - 2) / 2);
    if (m.kind === 'code') { R(x, y, w, h, '#12182a'); const off = Math.floor(t * 4), C = ['#ff6a9a', '#7ae0ff', '#f4d060', '#a8e880', '#c4a0ff'];
      for (let i = 0; i < n; i++) { const g = this.rng((i + off) * 7919 + 13); const ind = Math.floor(g() * 4) * 3; let cx = x + 3 + ind; const nt = 2 + Math.floor(g() * 3); R(x + 1, y + 1 + i * 2, 1, 1, '#3a4266'); for (let j = 0; j < nt; j++) { const L = 2 + Math.floor(g() * 8); if (cx + L > x + w - 2) break; R(cx, y + 1 + i * 2, L, 1, C[Math.floor(g() * 5)]); cx += L + 2; } }
      if ((t * 2) % 1 < 0.55) R(x + Math.round(w * 0.55), y + h - 3, 2, 2, '#ffffff'); }
    else if (m.kind === 'term') { R(x, y, w, h, '#050d08'); const off = Math.floor(t * 3);
      for (let i = 0; i < n; i++) { const g = this.rng((i + off) * 6151 + 5); const L = 4 + Math.floor(g() * (w - 10)), cc = g(); R(x + 2, y + 1 + i * 2, 2, 1, '#b8ffc8'); R(x + 5, y + 1 + i * 2, L, 1, cc < 0.12 ? '#ffe066' : cc < 0.5 ? '#39d353' : '#1f9a44'); }
      if ((t * 2) % 1 < 0.5) R(x + 5, y + h - 3, 2, 2, '#39d353'); }
    else { R(x, y, w, h, '#04100a'); for (let cx = 1; cx < w - 1; cx += 2) { const sp = 9 + ((cx * 7) % 9) * 2, head = (t * sp + cx * 5.3) % (h + 12);
      for (let k = 0; k < 8; k++) { const yy = Math.floor(head) - k; if (yy < 0 || yy >= h) continue; if (k > 0 && this.bay(cx, yy + Math.floor(t * 8)) < 0.22) continue; R(x + cx, y + yy, 1, 1, k === 0 ? '#d8ffe0' : k < 3 ? '#39d353' : k < 6 ? '#1a7a34' : '#0d3a1a'); } } }
  }

  dyn() {
    const { ctx: c, R, t, qs, yB, s, q } = this, ds = this.ds, PAL = ['#ff3a6a', '#ffb43a', '#3aff8a', '#3ab4ff', '#a03aff'];
    for (const b of this.bulbs) { const tw = 0.6 + 0.4 * Math.sin(t * 2 + b.ph); this.blit(c, this.glow(q(9), b.c), b.x, b.y, 0.4 * tw); R(b.x, b.y, 2, 2, b.c); R(b.x, b.y, 1, 1, '#ffffff'); }
    const gl = (cx, cy, r, col, a) => this.blit(c, this.glow(r, col), cx, cy, a);
    gl(this.mons[1].cx, this.mons[1].y + this.mons[1].h, qs(60), '#4ac8ff', 0.16 + 0.03 * Math.sin(t * 3)); gl(this.mons[0].cx, this.mons[0].y + this.mons[0].h, qs(40), '#39d353', 0.14); gl(this.mons[2].cx, this.mons[2].y + this.mons[2].h, qs(40), '#39d353', 0.12);
    const tw = this.tower; for (let i = 0; i < 2; i++) { const col = PAL[(Math.floor(t * 1.4) + i * 2) % 5], fy = tw.y + qs(6) + i * qs(8); this.disc(R, tw.x + (tw.w >> 1), fy, Math.max(2, qs(2.6)), col); R(tw.x + (tw.w >> 1), fy, 1, 1, '#0f0c1a'); } gl(tw.x + (tw.w >> 1), tw.y + tw.h / 2, qs(16), PAL[Math.floor(t * 1.4) % 5], 0.25);
    for (const m of this.mons) this.screen(m);
    const kb = this.kb; for (let i = 0; i < kb.w; i++) R(kb.x + i, kb.y, 1, 1, PAL[(((Math.floor(i / 3 - t * 9)) % 5) + 5) % 5]);
    const ty = t * 13, ty2 = t * 11;
    const hk = { x: ds.xh, y: yB, k: s, f: 1, hip: [0, 11.5], sh: [1.5 + Math.sin(t * 0.5) * 0.4, 26.5], head: [3.2, 32.6 + Math.sin(t * 0.9) * 0.3], feet: [[8, 0], [10.6, 0]], hands: [[14 + Math.sin(ty) * 0.8, 29.4 + Math.abs(Math.sin(ty * 0.8)) * 1.3], [12.4 + Math.sin(ty2 + 1) * 0.8, 29.4 + Math.abs(Math.sin(ty2 * 0.7 + 2)) * 1.3]], torso: '#3a2a5a', torsoD: '#28204a', pant: '#1e2a4a', pantD: '#161e38', shoe: '#c8283a', arm: '#3a2a5a', armD: '#28204a', fore: '#3a2a5a', foreD: '#28204a', skin: '#f2d4b8', hair: '#1c1416', hood: '#3a2a5a', phones: '#c8283a' };
    this.human(hk);
    if (this.mug) { if (this.spawn('steam', 3)) this.parts.push({ k: 'steam', x: this.mug.x + Math.random() * 3, y: this.mug.y, vx: (Math.random() - 0.5) * 3, vy: -7 - Math.random() * 4, life: 1.6, t0: t }); }
    const b = this.bbq, top = b.top, gx = b.gx, rad = b.rad, ry = b.ry;
    gl(gx, top, qs(46), '#ff7a2a', 0.3 + 0.08 * Math.sin(t * 11));
    for (let i = 0; i < 46; i++) { const px = gx + Math.round((this.rng(i * 31 + Math.floor(t * 6 + i) * 7)() - 0.5) * 2 * rad * 0.9), py = top + Math.round((this.rng(i * 17 + Math.floor(t * 5) * 3)() - 0.5) * ry * 1.4); if (Math.abs(px - gx) < rad * 0.9) R(px, py, 1, 1, i % 3 ? '#e8402e' : i % 3 === 1 ? '#ff8a2a' : '#ffd25a'); }
    for (let i = 0; i < 9; i++) { const fx = gx - rad * 0.7 + i * rad * 1.4 / 8, hh = 2 + Math.round(qs(4) * (0.5 + 0.5 * Math.abs(Math.sin(t * 9 + i * 1.7)))); R(fx, top - hh, 2, hh, '#e8402e'); R(fx, top - Math.round(hh * 0.7), 1, Math.round(hh * 0.7), '#ff8a2a'); R(fx, top - Math.round(hh * 0.35), 1, Math.round(hh * 0.35), '#ffd25a'); }
    const sk = (x0, y0, x1, y1, cook) => { this.pl(R, x0, y0, x1, y1, 1, '#c8a060'); for (let j = 0; j < 4; j++) { const u = 0.32 + j * 0.2, mx = x0 + (x1 - x0) * u, my = y0 + (y1 - y0) * u; R(mx - 1, my - 1, Math.max(2, qs(2.4)), Math.max(2, qs(2.4)), j % 2 ? cook[0] : cook[1]); R(mx - 1, my - 1, 1, 1, '#e0955a'); } };
    const CK = [['#8a4222', '#a8552e'], ['#a8552e', '#c26a3a'], ['#6a3018', '#8a4222']];
    for (let i = 0; i < 6; i++) sk(gx - qs(18) + i * qs(6), top + Math.round(ry * 0.8), gx - qs(11) + i * qs(6), top - Math.round(ry * 0.8), CK[i % 3]);
    if (this.spawn('smoke', 6)) this.parts.push({ k: 'smoke', x: gx + (Math.random() - 0.5) * rad * 0.9, y: top - 3, vx: 4 + Math.random() * 4, vy: -(9 + Math.random() * 7), life: 3.6, t0: t });
    if (this.spawn('spark', 3)) this.parts.push({ k: 'spark', x: gx + (Math.random() - 0.5) * rad, y: top - 2, vx: (Math.random() - 0.5) * 10, vy: -(20 + Math.random() * 18), life: 0.9, t0: t });
    const lift = Math.max(0, Math.sin(t * 1.3)), gh = { x: gx - qs(30), y: yB, k: s, f: 1, hip: [0, 19], sh: [2.6 + Math.sin(t * 1.3) * 0.7, 34], head: [4.4 + Math.sin(t * 1.3) * 0.5, 40.6], feet: [[-1.5, 0], [2.6, 0]], hands: [[15 + lift * 1.5, 32 + 6 * lift], [3, 22]], torso: '#2a2a3a', torsoD: '#1c1c2a', pant: '#2a3a5a', pantD: '#1e2a44', shoe: '#e8e0d0', arm: '#f2d4b8', armD: '#dcb898', fore: '#f2d4b8', foreD: '#dcb898', skin: '#f2d4b8', hair: '#1c1416', band: '#c8283a', extra: (P, seg) => seg([0.6, 19], [2, 30], 3.2, '#c8283a') };
    this.human(gh);
    { const hp = [gx - qs(30) + Math.round((15 + lift * 1.5) * s), yB - Math.round((32 + 6 * lift) * s)], ex = hp[0] + qs(13), ey = top - qs(2) - Math.round(lift * qs(6)); this.pl(R, hp[0], hp[1], ex, ey, 1, '#9a94a8'); this.pl(R, hp[0], hp[1] + 1, ex, ey + 2, 1, '#6a6478'); if (lift > 0.25) { sk(ex - qs(2), ey + 1, ex + qs(9), ey - qs(4), CK[2]); if (this.spawn('steam2', 4)) this.parts.push({ k: 'steam', x: ex + qs(6), y: ey - qs(4), vx: 1, vy: -9, life: 1.2, t0: t }); } }
    const sc = this.scr, ax = this.arc;
    gl(ax.x, ax.y + qs(14), qs(44), '#a06aff', 0.22 + 0.05 * Math.sin(t * 4));
    R(sc.x, sc.y, sc.w, sc.h, '#06060e'); const gt = t * 1.6, sw = Math.sin(gt) * qs(4);
    for (let rr = 0; rr < 3; rr++) for (let cc = 0; cc < 5; cc++) { const bx = sc.x + qs(2) + cc * qs(3) + Math.round(sw + qs(4)), by = sc.y + qs(2) + rr * qs(3) + Math.floor(gt % 8 / 2), col = rr === 0 ? '#ff6a9a' : rr === 1 ? '#39d353' : '#7ae0ff'; if (bx + 2 < sc.x + sc.w - 1 && ((Math.floor(t * 3) + cc + rr) % 7)) { R(bx, by, 2, 1, col); R(bx - 1 + ((Math.floor(t * 2) + cc) & 1) * 2, by + 1, 1, 1, col); } }
    const shp = sc.x + sc.w / 2 + Math.sin(t * 1.1) * sc.w * 0.3; R(shp - 1, sc.y + sc.h - 3, 3, 1, '#f4f0ec'); R(shp, sc.y + sc.h - 4, 1, 1, '#f4f0ec'); const bt = (t * 1.5) % 1; if (bt < 0.8) R(shp, sc.y + sc.h - 5 - bt * (sc.h - 6), 1, 2, '#f4c430');
    const g = this.gym, T = (t % 5.2), ease = v => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, v)))) / 2, sPh = T < 1.6 ? ease(T / 1.6) : T < 2.4 ? 1 : T < 4.6 ? 1 - ease((T - 2.4) / 2.2) : 0, ang = (1 - sPh) * 1.0, barX = 11, hipY = 12 + 7 * sPh, hipX = barX - 15 * Math.sin(ang) - 0.3, shX = hipX + 15 * Math.sin(ang), shY = hipY + 15 * Math.cos(ang), barY = Math.max(5.5, shY - 15);
    const lifter = { x: g.lx - Math.round(barX * s), y: yB, k: s, f: 1, hip: [hipX, hipY], sh: [shX, shY], head: [shX + 2.6 * Math.sin(ang) + 1.2, shY + 6.4], feet: [[barX - 2.4, 0], [barX + 2.4, 0]], hands: [[barX, barY], [barX - 1, barY]], torso: '#e8e0d0', torsoD: '#c8c0b0', pant: '#2a3a6a', pantD: '#1e2a4e', shoe: '#c8283a', arm: '#f2d4b8', armD: '#dcb898', fore: '#f2d4b8', foreD: '#dcb898', skin: '#f2d4b8', hair: '#1c1416', band: '#ffffff' };
    this.human(lifter);
    { const bx = g.lx, by = yB - Math.round(barY * s), pr = Math.round(5.6 * s); [[2, -1, '#14101c', '#5a1420'], [0, 0, '#2a2636', '#c8283a']].forEach(([dx, dy, o, i]) => { this.disc(R, bx + dx, by + dy, pr, o); this.disc(R, bx + dx, by + dy, Math.max(1, pr - Math.max(1, Math.round(pr * 0.35))), i); this.disc(R, bx + dx, by + dy, Math.max(1, Math.round(pr * 0.25)), '#9a94a8'); }); R(bx - Math.round(pr * 0.5), by - Math.round(pr * 0.7), Math.max(1, Math.round(pr * 0.5)), 1, '#ffffff66'); R(bx, by, 1, 1, '#ffffff'); }
    if (T > 1.9 && T < 2.4 && Math.random() < 0.2) this.parts.push({ k: 'sweat', x: g.lx - Math.round(6 * s) + Math.random() * 4, y: yB - Math.round(44 * s), vx: -6 - Math.random() * 6, vy: -8, life: 0.9, t0: t });
    const cm = this.cam, dr = this.drone, dt = t;
    { const cx = cm.cx; if ((t * 1.2) % 2 < 1) { R(cm.rx, cm.ry, 2, 2, '#ff2a3a'); gl(cm.rx, cm.ry, qs(8), '#ff2a3a', 0.4); } if (this.flash > 0) { gl(cm.lx, cm.ly, qs(34), '#ffffff', Math.min(1, this.flash)); R(cm.lx - 1, cm.ly - 1, 3, 3, '#ffffff'); } }
    const dxp = dr.x, dyp = dr.y, sh = Math.max(qs(6), qs(22) - Math.round((yB - dyp) / 14)), tilt = Math.round(Math.cos(t * 0.4) * 2);
    R(dxp - sh / 2, yB + qs(6), sh, 1, '#0f0c1a'); R(dxp - sh / 4, yB + qs(6) + 1, sh / 2, 1, '#0f0c1a');
    { const D = (a, b, w, h, col) => R(dxp + a, dyp + b, w, h, col), q2 = qs; const rot = (a, b) => { const fl = (Math.floor(t * 30) & 1); c.globalAlpha = 0.55; R(dxp + a - q2(6), dyp + b, q2(12) - fl, 1, '#c8c8dc'); R(dxp + a - q2(4), dyp + b - 1, q2(8) + fl, 1, '#a0a0b8'); c.globalAlpha = 1; R(dxp + a - 1, dyp + b + 1, 2, 2, '#1e1a2a'); };
      this.pl(R, dxp - q2(7), dyp, dxp - q2(15), dyp - q2(4) + tilt, 2, '#2a2a38'); this.pl(R, dxp + q2(7), dyp, dxp + q2(15), dyp - q2(4) - tilt, 2, '#2a2a38'); this.pl(R, dxp - q2(6), dyp - 1, dxp - q2(11), dyp - q2(7) + tilt, 1, '#3a3a4a'); this.pl(R, dxp + q2(6), dyp - 1, dxp + q2(11), dyp - q2(7) - tilt, 1, '#3a3a4a');
      rot(-q2(11), -q2(8) + tilt); rot(q2(11), -q2(8) - tilt); D(-q2(9), -q2(2), q2(18), q2(5), '#3a3a4c'); D(-q2(9), -q2(2), q2(18), 1, '#6a6a80'); D(-q2(4), -q2(4), q2(8), q2(2), '#4a4a5e'); D(q2(3), -q2(1), q2(4), 2, '#c8283a'); rot(-q2(15), -q2(4) + tilt); rot(q2(15), -q2(4) - tilt);
      D(-q2(2), q2(3), q2(4), q2(3), '#14141e'); D(-q2(2), q2(3), q2(4), 1, '#3a3a4a'); D(-q2(3), q2(5), 1, 1, '#7ae0ff'); D(-q2(7), q2(2), 1, 1, (t * 3) % 1 < 0.5 ? '#ff2a3a' : '#400a0a'); D(q2(6), q2(2), 1, 1, (t * 3 + 0.5) % 1 < 0.5 ? '#3aff8a' : '#0a3a1a'); gl(dxp - q2(7), dyp + q2(2), q2(6), '#ff2a3a', 0.25 * ((t * 3) % 1 < 0.5 ? 1 : 0.3)); }
    if (this.snap > 0) { const a = Math.min(1, this.snap * 2.4), L = qs(5), bx = dxp - qs(22), by = dyp - qs(14), bw = qs(44), bh = qs(28); c.globalAlpha = a; [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]].forEach(([x0, y0, sx, sy]) => { R(sx > 0 ? x0 : x0 - L, y0, L, 1, '#ffffff'); R(x0, sy > 0 ? y0 : y0 - L, 1, L, '#ffffff'); }); c.globalAlpha = 1; }
    this.coinP.forEach(cn => { const w = Math.max(1, Math.round(Math.abs(Math.cos(t * 3 + cn.ph)) * qs(4))), cy = cn.y + Math.round(Math.sin(t * 2 + cn.ph) * qs(3)); gl(cn.x, cy, qs(9), '#f4c430', 0.28); R(cn.x - w, cy - qs(3), w * 2 + 1, qs(6), '#f4c430'); R(cn.x - w, cy - qs(3), w * 2 + 1, 1, '#fff0a0'); R(cn.x + w, cy - qs(3), 1, qs(6), '#a67c22'); if (w > 1) R(cn.x, cy - 1, 1, 2, '#a67c22'); if ((Math.floor(t * 2 + cn.ph * 3) % 6) === 0) R(cn.x + qs(5), cy - qs(4), 1, 1, '#ffffff'); });
    for (const p of this.parts) { const a = (t - p.t0) / p.life; if (a < 0 || a > 1) continue; c.globalAlpha = p.k === 'smoke' ? 0.34 * (1 - a) : p.k === 'steam' ? 0.5 * (1 - a) : 1 - a * a;
      const sz = p.k === 'smoke' ? Math.max(1, Math.round((1 + a * 5) * s)) : p.k === 'steam' ? Math.max(1, Math.round((1 + a * 2) * s)) : Math.max(1, Math.round(s));
      R(p.x, p.y, sz, sz, p.k === 'smoke' ? '#9a94aa' : p.k === 'steam' ? '#f4f0f6' : p.k === 'spark' ? (a < 0.5 ? '#ffd25a' : '#ff7a2a') : p.k === 'sweat' ? '#9ae0ff' : '#f4c430'); }
    c.globalAlpha = 1;
  }
  spawn(k, rate) { this.sp[k] = (this.sp[k] || 0) + this.dtStep * rate; if (this.sp[k] >= 1) { this.sp[k] -= 1; return true; } return false; }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.acc += dt; this.last = now; if (this.acc < 1 / 30 - 0.002) return;
    const step = this.acc * (this.props.speed ?? 1) * (this.reduce ? 0.3 : 1); this.acc = 0; this.t += step; this.dtStep = step;
    const par = (this.props.parallax ?? true) && !this.mob; this.mx += ((par ? this.mt : 0) - this.mx) * 0.08;
    const { PW, q, gy, s } = this, t = this.t, dr = this.drone, X = this.X;
    dr.x = X(0.68) + Math.sin(t * 0.32) * PW * 0.17; dr.y = gy - q(118) + Math.sin(t * 0.83) * q(9) + Math.sin(t * 0.32 + 1) * q(6);
    this.flash = Math.max(0, this.flash - step * 3.2); this.snap = Math.max(0, this.snap - step);
    if (t > this.nextFlash) { this.nextFlash = t + 5 + Math.random() * 3; if (dr.x < this.cam.lx - 30) { this.flash = 1; this.snap = 0.5; } }
    this.parts = this.parts.filter(p => { const a = t - p.t0; if (a > p.life) return false; p.x += p.vx * step * s; p.y += p.vy * step * s; if (p.k === 'spark' || p.k === 'sweat' || p.k === 'coin') p.vy += 46 * step; if (p.k === 'smoke') p.vx += 0.6 * step; return true; });
    this.draw();
  }
  draw() {
    const { ctx: c, M, t, mx, R } = this, o = k => Math.round(mx * k) - M, o0 = o(2), o1 = o(4);
    c.globalAlpha = 1; c.drawImage(this.L0, o0, 0);
    for (const st of this.stars) { const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + st.ph)); c.globalAlpha = a; R(st.x + o0, st.y, 1, 1, st.c); } c.globalAlpha = 1;
    for (const a of this.ants) if ((t * 0.9 + a.x * 0.13) % 1 < 0.5) { R(a.x + o0, a.y, 1, 1, '#ff3a4a'); this.blit(c, this.glow(this.q(5), '#ff3a4a'), a.x + o0, a.y, 0.35); }
    c.drawImage(this.L1, o1, 0);
    c.save(); c.translate(o1, 0); this.dyn(); c.restore();
  }
}

export function startScene(canvas, props) {
  const scene = new AboutScene(canvas, props);
  scene.mount();
  return scene;
}

/** 底部五个爱好卡片的像素图标（原设计在 renderVals 里生成 data URL） */
export function iconURLs() {
    const P = { '.': null, k: '#1e1412', g: '#39d353', w: '#fff6e6', r: '#c8283a', R: '#8c1626', y: '#f4c430', Y: '#a67c22', b: '#5a9ae0', n: '#c26a3a', N: '#6a3018', e: '#9a94a8', E: '#5a5468', d: '#2a2436' };
    const IC = {
      hack: ['..kkkkkkkkkk..', '.kEEEEEEEEEEk.', '.kEkkkkkkkkEk.', '.kEkgkkkkkkEk.', '.kEkkgkkkkkEk.', '.kEkgkkkkkkEk.', '.kEkkkkgggkEk.', '.kEkkkkkkkkEk.', '.kEEEEEEEEEEk.', '..kkkkkkkkkk..', '....kEEEEk....', '...kkkkkkkk...'],
      game: ['.kkkkkkkkkkkk.', 'kEEEEEEEEEEEEk', 'kEEEkEEEEEyEEk', 'kEEkkkEEEbErEk', 'kEEEkEEEEEgEEk', 'kEEEEEEEEEEEEk', 'kEEEEkkkkEEEEk', '.kEEk....kEEk.', '..kkk....kkk..'],
      bbq: ['..............', '.kkkk.kkkk.kkk', 'knnnnYnnnnYnnk', 'knNnnYnNnnYnNk', 'knnNnYnnNnYnnk', '.kkkk.kkkk.kkk', '..............'],
      gym: ['.kk........kk.', 'krrk......krrk', 'krrk......krrk', 'krrkkEEEEkkrrk', 'krrk......krrk', 'krrk......krrk', '.kk........kk.'],
      cam: ['...kkk........', 'kkkkEEkkkkkkkk', 'kEEEEEEEEEEEEk', 'kEEEkkkkEEEEEk', 'kEEkbbbbkEEEEk', 'kEEkbwbbkEEyEk', 'kEEkbbbbkEEEEk', 'kEEEkkkkEEEEEk', 'kEEEEEEEEEEEEk', 'kkkkkkkkkkkkkk']
    };
    const url = rows => { const w = Math.max(...rows.map(r => r.length)), c = document.createElement('canvas'); c.width = w; c.height = rows.length; const x = c.getContext('2d'); rows.forEach((row, j) => [...row].forEach((ch, i) => { const col = P[ch]; if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); } })); return c.toDataURL(); };
  return { hack: url(IC.hack), game: url(IC.game), bbq: url(IC.bbq), gym: url(IC.gym), cam: url(IC.cam) };
}
