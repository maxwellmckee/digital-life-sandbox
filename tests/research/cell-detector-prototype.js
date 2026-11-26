/* Cell detector research prototype (docs/RESEARCH.md, "Finding cells"). Evaluated in the page against an open dish,
 * it follows enclosures for window.RUN_STEPS steps (default 3,000), scores them and draws boxes over the dish. It uses
 * the page's own functions and the test helpers DL and waitIdle. The CELLS feature will be built from this. */
(async () => {
/* Cell detector v2, a research prototype run on the open dish for window.RUN_STEPS steps, sampled every 150.
   Each sample finds enclosures two ways at five brightness levels: spaces walled in (holes), and closed outlines filled
   in with whatever is inside them (objects), so a cell full of texture is still one cell. Candidates are followed from
   sample to sample by overlap. For each it measures, on the particles themselves:
     closure   - at how many brightness levels it is closed, and how much brighter its wall is than just outside;
     homeostasis - how steady its outline and wall stay, and how many of its particles stay inside (retention);
     inner life - how far the particles that stay inside move about (stirring);
     complexity - inner bodies (organelles), how many strains live inside, and how varied its inside looks;
     persistence - how long it has lasted.
   The score multiplies the parts, so a cell must have all of them. */
const sleep = ms => new Promise(res => setTimeout(res, ms));
const A = arena, s = A.sim, { w, h, agents } = s.q, CELL = 8, gw = Math.ceil(w / CELL), gh = Math.ceil(h / CELL), N = gw * gh;
const STEPS = window.RUN_STEPS || 3000, EVERY = 150, TAUS = [.15, .25, .35, .45, .55, .65, .75, .85];
const ex = Array.from({ length: 6 }, (_, c) => A.channels[c] ? st.view.exposure / ((.12 / (1 - A.channels[c].decay)) * 3) : 0);
const R = (dishRadius(s.q) - 6) / CELL, inGlass = new Uint8Array(N);
for (let k = 0; k < N; k++) { const x = k % gw, y = (k - x) / gw; inGlass[k] = Math.hypot(x + .5 - gw / 2, y + .5 - gh / 2) < R ? 1 : 0; }
const n4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], n8 = [...n4, [1, 1], [1, -1], [-1, 1], [-1, -1]];
const stack = new Int32Array(N);
async function brightness() {
  const I = new Float32Array(N), band = 216;
  for (let y0 = 0; y0 < h; y0 += band) {
    const bh = Math.min(band, h - y0), a = await readRegion(s.trail[s.cur], 0, y0, w, bh), b = await readRegion(A.trailB[s.cur], 0, y0, w, bh);
    for (let y = 0; y < bh; y++) { const row = Math.floor((y0 + y) / CELL) * gw; for (let x = 0; x < w; x++) { const o = (y * w + x) * 4, k = row + (x >> 3); let top = 0; for (let c = 0; c < 6; c++) { if (!ex[c]) continue; const t = 1 - Math.exp(-(c < 3 ? a[o + c] : b[o + c - 3]) * ex[c]); if (t > top) top = t; } I[k] += top / (CELL * CELL); } }
  }
  return I;
}
// Components of the cells where pick(k) holds, side by side (n4) or also corner to corner (n8).
function components(pick, nb) {
  const lab = new Int32Array(N).fill(-1), comps = [];
  for (let k = 0; k < N; k++) {
    if (!pick(k) || lab[k] !== -1) continue;
    const id = comps.length, cells = [];
    let top = 0; lab[k] = id; stack[top++] = k;
    while (top) { const p = stack[--top], x = p % gw, y = (p - x) / gw; cells.push(p); for (const [dx, dy] of nb) { const nx = x + dx, ny = y + dy, q = ny * gw + nx; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh || lab[q] !== -1 || !pick(q)) continue; lab[q] = id; stack[top++] = q; } }
    comps.push(cells);
  }
  return { lab, comps };
}
function regionsAt(I, tau) {
  const wall = k => inGlass[k] && I[k] >= tau;
  // Open broth reaches out to the glass; anything unwalled it can't reach is enclosed.
  const open = new Uint8Array(N); let top = 0;
  for (let k = 0; k < N; k++) if (!inGlass[k]) { open[k] = 1; stack[top++] = k; }
  while (top) { const p = stack[--top], x = p % gw, y = (p - x) / gw; for (const [dx, dy] of n4) { const nx = x + dx, ny = y + dy, q = ny * gw + nx; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh || open[q] || wall(q)) continue; open[q] = 1; stack[top++] = q; } }
  const holes = components(k => !wall(k) && !open[k], n4), walls = components(wall, n8);
  // Which wall pieces border each hole, and which holes each wall piece encloses alone.
  const owner = holes.comps.map(cells => { const set = new Set(); for (const p of cells) { const x = p % gw, y = (p - x) / gw; for (const [dx, dy] of n8) { const q = (y + dy) * gw + x + dx; if (q >= 0 && q < N && wall(q)) set.add(walls.lab[q]); } } return set; });
  // Wall pieces that touch no open broth and border a single hole are bodies inside that hole.
  const touchesOpen = walls.comps.map(cells => cells.some(p => { const x = p % gw, y = (p - x) / gw; return n8.some(([dx, dy]) => { const q = (y + dy) * gw + x + dx; return q < 0 || q >= N || open[q]; }); }));
  const holesOf = walls.comps.map(() => new Set());
  owner.forEach((set, i) => { for (const wid of set) holesOf[wid].add(i); });
  const islandsIn = holes.comps.map(() => []);
  walls.comps.forEach((cells, wid) => { if (!touchesOpen[wid] && holesOf[wid].size === 1) islandsIn[[...holesOf[wid]][0]].push(wid); });
  const out = [];
  // A hole as a cell: the hole, the bodies inside it, and the wall around it.
  holes.comps.forEach((cells, i) => {
    const set = new Set(cells);
    for (const wid of islandsIn[i]) for (const p of walls.comps[wid]) set.add(p);
    for (const p of cells) { const x = p % gw, y = (p - x) / gw; for (const [dx, dy] of n8) { const q = (y + dy) * gw + x + dx; if (q >= 0 && q < N && wall(q) && !islandsIn[i].includes(walls.lab[q])) set.add(q); } }
    out.push([...set]);
  });
  // An outline as a cell: a wall piece that touches open broth, filled with the holes only it borders and their bodies.
  const owned = new Map();
  owner.forEach((set, i) => { if (set.size === 1) { const wid = [...set][0]; if (!owned.has(wid)) owned.set(wid, []); owned.get(wid).push(i); } });
  for (const [wid, list] of owned) if (touchesOpen[wid]) out.push([...walls.comps[wid], ...list.flatMap(i => [...holes.comps[i], ...islandsIn[i].flatMap(j => walls.comps[j])])]);
  return out;
}
const shapeOf = cells => {
  const set = new Set(cells); let x0 = gw, x1 = 0, y0 = gh, y1 = 0, edges = 0;
  for (const p of cells) { const x = p % gw, y = (p - x) / gw; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); for (const [dx, dy] of n4) if (!set.has((y + dy) * gw + x + dx)) edges++; }
  return { cells, set, x0, x1, y0, y1, area: cells.length, compact: 4 * Math.PI * cells.length / (edges * edges) };
};
const iou = (a, b) => { let both = 0; for (const p of a.cells) if (b.set.has(p)) both++; return both / (a.area + b.area - both); };
function candidates(I) {
  const found = [];
  for (const tau of TAUS) for (const cells of regionsAt(I, tau)) {
    const r = shapeOf(cells), bw = r.x1 - r.x0 + 1, bh = r.y1 - r.y0 + 1;
    // A cell's size and shape: not a speck, not most of the dish, and not a long corridor.
    if (r.area < 16 || r.area > N * .08 || Math.min(bw, bh) < 4 || r.compact < .25) continue;
    const same = found.find(c => iou(c.r, r) > .5);
    if (same) { same.levels.add(tau); if (r.area > same.r.area) same.r = r; } else found.push({ r, levels: new Set([tau]) });
  }
  return found;
}
// Particles by grid cell, for counting what is inside a region.
function bucket(pos) {
  const count = new Int32Array(N + 1);
  for (let i = 0; i < agents; i++) { const x = pos[i * 4]; if (x < 0) continue; count[Math.min(N - 1, ((pos[i * 4 + 1] / CELL) | 0) * gw + ((x / CELL) | 0)) + 1]++; }
  for (let k = 0; k < N; k++) count[k + 1] += count[k];
  const fill = count.slice(0, N), list = new Int32Array(count[N]);
  for (let i = 0; i < agents; i++) { const x = pos[i * 4]; if (x < 0) continue; const k = Math.min(N - 1, ((pos[i * 4 + 1] / CELL) | 0) * gw + ((x / CELL) | 0)); list[fill[k]++] = i; }
  return { start: count, list };
}
const inside = (bk, r) => { const out = []; for (const p of r.cells) for (let j = bk.start[p]; j < bk.start[p + 1]; j++) out.push(bk.list[j]); return out; };
function ringOf(r) { const ring = []; for (const p of r.cells) { const x = p % gw, y = (p - x) / gw; if (n4.some(([dx, dy]) => !r.set.has((y + dy) * gw + x + dx))) ring.push(p); } return ring; }
function outsideBand(r) { const band = new Set(); for (const p of r.cells) { const x = p % gw, y = (p - x) / gw; for (const [dx, dy] of n8) for (const m of [1, 2]) { const q = (y + dy * m) * gw + x + dx * m; if (!r.set.has(q) && q >= 0 && q < N && inGlass[q]) band.add(q); } } return [...band]; }
const mean = (list, f) => list.length ? list.reduce((t, v) => t + f(v), 0) / list.length : 0;
// LMC complexity of the inside's brightness: high when it is neither uniform nor noise.
function lmc(values) { const bins = new Array(8).fill(0); for (const v of values) bins[Math.min(7, Math.floor(v * 8))]++; const n = values.length || 1; let H = 0, D = 0; for (const b of bins) { const p = b / n; if (p) H -= p * Math.log(p); D += (p - 1 / 8) ** 2; } return (H / Math.log(8)) * D * 8; }
function organelles(I, r, tau) {
  const ring = new Set(ringOf(r)), deep = new Set();
  for (const p of r.cells) { if (ring.has(p)) continue; const x = p % gw, y = (p - x) / gw; if (n4.every(([dx, dy]) => !ring.has((y + dy) * gw + x + dx))) deep.add(p); }
  const bodies = components(k => deep.has(k) && I[k] >= tau + .1, n8);
  return bodies.comps.filter(c => c.length >= 2).length;
}

const tracks = [];
let prevPos = null, prevBk = null, nextId = 1;
for (let t = 0; t <= STEPS; t += EVERY) {
  if (t) await DL.arenaAdvance(EVERY);
  const I = await brightness(), pos = new Float32Array(await readBack(s.agentBuf, agents * 16)), bk = bucket(pos), found = candidates(I);
  for (const tr of tracks) tr.seen = false;
  for (const c of found) {
    const r = c.r;
    const near = (a, b) => { let both = 0; for (const p of a.cells) if (b.set.has(p)) both++; return Math.max(both / (a.area + b.area - both), both / Math.min(a.area, b.area) * .8); };
    let tr = tracks.filter(x => x.alive && !x.seen).map(x => [x, near(x.r, r)]).filter(([, v]) => v > .3).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!tr) { tr = { id: nextId++, born: s.step, alive: true, history: [] }; tracks.push(tr); }
    const ring = ringOf(r), outside = outsideBand(r), members = inside(bk, r);
    const edge = new Set(ring); for (const p of ring) { const x = p % gw, y = (p - x) / gw; for (const [dx, dy] of n8) { const q = (y + dy) * gw + x + dx; if (r.set.has(q)) edge.add(q); } }
    const edgeLight = [...edge].map(p => I[p]).sort((a, b) => b - a), wallLight = mean(edgeLight.slice(0, Math.max(1, edgeLight.length >> 1)), v => v), outLight = mean(outside, p => I[p]);
    const m = { step: s.step, area: r.area, closure: Math.min(1, c.levels.size / 3), contrast: wallLight - outLight, particles: members.length,
      organelles: organelles(I, r, Math.min(...c.levels)), texture: lmc(r.cells.map(p => I[p])), shape: tr.r ? iou(tr.r, r) : null, retention: null, stirring: null };
    if (tr.r && tr.members && prevPos) {
      let kept = 0, moved = 0;
      for (const i of tr.members) { const x = pos[i * 4]; if (x < 0) continue; const k = Math.min(N - 1, ((pos[i * 4 + 1] / CELL) | 0) * gw + ((x / CELL) | 0)); if (r.set.has(k)) { kept++; moved += Math.hypot(x - prevPos[i * 4], pos[i * 4 + 1] - prevPos[i * 4 + 1]); } }
      m.retention = kept / Math.max(1, tr.members.length);
      m.stirring = kept ? moved / kept / (Math.sqrt(r.area / Math.PI) * CELL) : 0;
    }
    Object.assign(tr, { r, members, seen: true, last: s.step });
    tr.history.push(m);
  }
  for (const tr of tracks) if (tr.alive && !tr.seen && s.step - tr.last > EVERY * 3) tr.alive = false;
  prevPos = pos; prevBk = bk;
}
// Strains living inside each surviving cell, from the particles' lineages.
const genes = new Uint32Array(await readBack(A.genes, agents * 64));
const clamp01 = v => Math.max(0, Math.min(1, v));
const scored = tracks.filter(tr => tr.alive && tr.history.length >= 3).map(tr => {
  const H = tr.history, last = H.at(-1), recent = H.slice(-6), age = last.step - tr.born;
  const lineages = new Map(); for (const i of tr.members) { const l = genes[i * 16 + 1]; lineages.set(l, (lineages.get(l) || 0) + 1); }
  const n = tr.members.length || 1; let ent = 0; for (const v of lineages.values()) { const p = v / n; ent -= p * Math.log(p); }
  const strainsInside = Math.exp(ent);
  const avg = k => { const v = recent.map(x => x[k]).filter(x => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
  const parts = {
    closure: clamp01(avg('closure') * clamp01(avg('contrast') / .25 + .3)),
    homeostasis: clamp01(avg('shape') * avg('retention')),
    innerLife: clamp01(avg('stirring') / .3) * clamp01(avg('retention') / .5),
    complexity: clamp01(.35 + .25 * Math.min(avg('organelles'), 3) / 3 + .25 * clamp01((strainsInside - 1) / 1.5) + .15 * clamp01(avg('texture') / .3)),
    persistence: 1 - Math.exp(-age / 1500),
  };
  const score = Math.pow(parts.closure, .3) * Math.pow(parts.homeostasis, .2) * Math.pow(parts.innerLife, .2) * Math.pow(parts.complexity, .15) * Math.pow(parts.persistence, .15);
  return { id: tr.id, score, parts, age, strainsInside: +strainsInside.toFixed(2), organelles: +avg('organelles').toFixed(1), retention: +avg('retention').toFixed(2), stirring: +avg('stirring').toFixed(2), shape: +avg('shape').toFixed(2), area: last.area, r: tr.r };
}).sort((a, b) => b.score - a.score);
// Boxes over the dish: green for scores of 60% or more.
document.getElementById('cellOverlay')?.remove();
const sim = document.getElementById('sim'), rr = sim.getBoundingClientRect(), z = arena.zoom, cv = document.createElement('canvas');
cv.id = 'cellOverlay';
Object.assign(cv.style, { position: 'fixed', left: rr.left + 'px', top: rr.top + 'px', width: rr.width + 'px', height: rr.height + 'px', pointerEvents: 'none', zIndex: 50 });
cv.width = rr.width; cv.height = rr.height; document.body.append(cv);
const g = cv.getContext('2d'), toX = v => ((v * CELL / w - z.x) * z.k + .5) * rr.width, toY = v => ((v * CELL / h - z.y) * z.k + .5) * rr.height;
g.font = '10px ui-monospace, Consolas, monospace';
scored.slice(0, 12).forEach(c => {
  const x = toX(c.r.x0) - 3, y = toY(c.r.y0) - 3, bw = toX(c.r.x1 + 1) - toX(c.r.x0) + 6, bh = toY(c.r.y1 + 1) - toY(c.r.y0) + 6, pass = c.score >= .6;
  g.strokeStyle = pass ? '#5dff9a' : 'rgba(255,255,255,.85)'; g.lineWidth = 1.5; g.strokeRect(x, y, bw, bh);
  const label = `${c.organelles >= 1 ? 'EU' : 'PR'}-${c.id} ${Math.round(c.score * 100)}%`;
  g.fillStyle = 'rgba(3,6,7,.75)'; g.fillRect(x, y - 13, g.measureText(label).width + 6, 13);
  g.fillStyle = pass ? '#5dff9a' : '#fff'; g.fillText(label, x + 3, y - 3);
});
const fmt = v => typeof v === 'number' ? +v.toFixed(2) : v;
window.__lost = tracks.filter(tr => !scored.find(c => c.id === tr.id)).map(tr => `${tr.id} ${tr.alive ? 'alive' : 'lost'} at (${((tr.r.x0 + tr.r.x1) / 2 / gw).toFixed(2)},${((tr.r.y0 + tr.r.y1) / 2 / gh).toFixed(2)}) area ${tr.r.area} seen ${tr.history.length}x from ${tr.born}`);
return JSON.stringify({ steps: STEPS, tracked: tracks.length, survived: scored.length, passed: scored.filter(c => c.score >= .6).length,
  top: scored.slice(0, 6).map(c => ({ id: c.id, score: fmt(c.score), age: c.age, area: c.area, parts: Object.fromEntries(Object.entries(c.parts).map(([k, v]) => [k, fmt(v)])), retention: c.retention, stirring: c.stirring, shape: c.shape, organelles: c.organelles, strains: c.strainsInside })) });
})()
