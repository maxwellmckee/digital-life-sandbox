/* Digital Life Sandbox test suite. tests/run.ps1 loads the page in a fresh headless Chrome, evaluates this file, then
   runs each check by name and prints the result. Everything happens in the browser's private storage (OPFS) of a
   throwaway profile, and the organisms are grown from fixed seeds, so no real saves are ever read or changed.
   Checks use the page's own functions, which a classic script makes reachable by name. */
(() => {
  const sleep = ms => new Promise(res => setTimeout(res, ms));
  const idle = async () => { await sleep(50); for (let i = 0; i < 2400 && arena.busy; i++) await sleep(50); };
  const fnv = (bytes, x = 0x811c9dc5) => { for (let i = 0; i < bytes.length; i++) x = Math.imul(x ^ bytes[i], 16777619); return (x >>> 0).toString(16); };
  const texHash = async (t, w, h) => fnv(new Uint8Array((await readRegion(t, 0, 0, w, h)).buffer));
  const seg = (id, v) => document.querySelector(`#${id} [data-value="${v}"]`).click();
  const census = async () => { for (let i = 0; i < 100 && arena.censusPending; i++) await sleep(20); arenaCensus(); await sleep(5); for (let i = 0; i < 100 && arena.censusPending; i++) await sleep(20); };
  const fx = {};

  // An organism grown from settings and a seed in the Microscope, as in the regression table. Its species start from the
  // defaults each time, so no earlier organism's settings carry over.
  async function grow({ quality, seed, init, count, eco, hybrid, steps }) {
    DL.goRoom('lab'); await sleep(100);
    DL.st.species = SPECIES_TEMPLATES.map(x => ({ ...x }));
    seg('segQuality', quality); seg('segCount', count); if (eco) seg('segEco', eco); seg('segHybrid', hybrid);
    DL.st.seed = seed; DL.st.init = init; DL.restart();
    await DL.advance(steps);
  }
  // Cuts the organism on screen on the bench, as CUT does, and returns the specimen.
  async function cutSolo() {
    DL.goRoom('incubator'); await sleep(100);
    await arenaFromSolo(); await idle();
    await DL.benchCut(); await idle(); await sleep(50);
    const sp = arena.placing;
    DL.cancelPlacing();
    return sp;
  }
  async function freshDish(size = 's', seed = 31) {
    DL.goRoom('incubator'); await sleep(100);
    arena.founders = []; arena.rows = null; arena.origin = null; arena.dishId = null; arena.seed = seed;
    Object.assign(arena.params, defaults(ARENA_PARAMS), { cohesion: 1 });
    await setDishSize(size); await idle();
    resetArena();
  }
  const dishHash = async () => {
    const s = arena.sim, { w, h } = s.q, { gw, gh } = arena.d;
    return [await texHash(s.trail[s.cur], w, h), await texHash(arena.trailB[s.cur], w, h), await texHash(s.field[arena.fcur], gw, gh),
      await texHash(arena.rd[0], gw, gh), fnv(new Uint8Array(await readBack(s.agentBuf, s.q.agents * 16)))].join('-');
  };

  const checks = {
    // The five regression cases from the README: the Microscope must run exactly as it always has.
    async 'Microscope fingerprints'() {
      const cases = [['med', 12345, 'scatter', 1, null, 'off', '678BF9A8'], ['low', 777, 'in', 2, 'chase', 'off', 'F6A141F8'], ['high', 9001, 'out', 3, 'cycle', 'off', '8E45D7FF'],
        ['low', 5150, 'scatter', 2, 'rival', 'coral', '96ADE82B'], ['med', 6060, 'out', 3, 'cycle', 'cells', '573B3DF1']];
      const wrong = [];
      for (const [quality, seed, init, count, eco, hybrid, expected] of cases) {
        await grow({ quality, seed, init, count, eco, hybrid, steps: 400 });
        const h = await DL.hash();
        if (h !== expected) wrong.push(`${quality} ${seed}: ${h}, expected ${expected}`);
      }
      return { ok: !wrong.length, detail: wrong.length ? wrong.join('; ') : '5 of 5 match' };
    },

    // Two seeded organisms cut and placed in a 1x dish give the same dish every time.
    // Run with one food and even sunlight, as every dish was before PATCHES and FOODS, so it also shows that old dishes
    // run exactly as before.
    async 'Incubator fingerprint'() {
      const run = async () => {
        await freshDish('s', 31);
        Object.assign(arena.params, { patches: 0, foods: 1, cohesion: 0 });
        await foundAt(fx.a, .5, .5, 1); await idle();
        await foundAt(fx.b, .3, .45, .5); await idle();
        await DL.arenaAdvance(300);
        return await dishHash();
      };
      const first = await run(), second = await run();
      return { ok: first === second && (!EXPECTED.dish || first === EXPECTED.dish), detail: first === second ? (EXPECTED.dish ? (first === EXPECTED.dish ? 'matches' : `${first}, expected ${EXPECTED.dish}`) : 'repeats exactly: ' + first) : 'differs between two runs' };
    },

    // A body keeps its true size in every dish: the same early trail, and the same spread after 400 steps.
    async 'Same body in every dish size'() {
      const crops = {}, spreads = {};
      for (const key of ['s', 'l', 'm']) {
        await freshDish(key, 31);
        Object.assign(arena.params, { patches: 0 });
        const s = arena.sim, cx = s.q.w / 2, cy = Math.round(s.q.h / 2 / 4) * 4, R = 200;
        await foundAt(fx.a, .5, cy / s.q.h, .5); await idle();
        await DL.arenaAdvance(12);
        crops[key] = await readRegion(s.trail[s.cur], cx - R, cy - R, 2 * R, 2 * R);
        await DL.arenaAdvance(388);
        const pos = new Float32Array(await readBack(s.agentBuf, s.q.agents * 16)), rings = [50, 100, 200], n = [0, 0, 0];
        let alive = 0;
        for (let i = 0; i < s.q.agents; i++) { if (pos[i * 4] < 0) continue; alive++; const d = Math.hypot(pos[i * 4] - cx, pos[i * 4 + 1] - cy); rings.forEach((r, k) => { if (d <= r) n[k]++; }); }
        spreads[key] = n.map(v => v / alive);
      }
      const gap = (a, b) => { let d = 0, t = 0; for (let i = 0; i < a.length; i += 4) for (let c = 0; c < 3; c++) { d += Math.abs(a[i + c] - b[i + c]); t += Math.abs(a[i + c]); } return d / t; };
      const trailGap = Math.max(gap(crops.s, crops.l), gap(crops.s, crops.m));
      const spreadGap = Math.max(...['l', 'm'].flatMap(k => spreads[k].map((v, i) => Math.abs(v - spreads.s[i]))));
      return { ok: trailGap < 1e-3 && spreadGap < .01, detail: `early trail differs by ${trailGap.toExponential(1)}, spread by ${(spreadGap * 100).toFixed(2)}%` };
    },

    // Saving a dish, running on, then opening the save and running as far gives the same dish. REPLAY returns to the save.
    async 'Saved dish reopens exactly'() {
      await freshDish('s', 31);
      await foundAt(fx.a, .5, .5, 1); await idle();
      await foundAt(fx.b, .3, .45, .5); await idle();
      await DL.arenaAdvance(200);
      await census();
      // Saved trails are rounded, so the live trails are rounded the same way first.
      const s = arena.sim, { w, h } = s.q;
      for (const t of [s.trail[s.cur], arena.trailB[s.cur]]) {
        const f = await readRegion(t, 0, 0, w, h), u = new Uint32Array(f.buffer);
        for (let i = 0; i < u.length; i++) u[i] &= DISH_TRAIL_BITS;
        device.queue.writeTexture({ texture: t }, f, { bytesPerRow: w * 16 }, [w, h]);
      }
      await saveDish(); await idle();
      await DL.arenaAdvance(300);
      const original = await dishHash();
      const item = (await readDishes(await savesFolder())).find(x => x.meta.id === arena.dishId);
      await freshDish('s', 99);
      await openDish(item); await idle();
      await DL.arenaAdvance(300);
      const reopened = await dishHash();
      await DL.replayArena(); await idle();
      const replayStep = arena.sim.step;
      await DL.arenaAdvance(300);
      const replayed = await dishHash();
      const ok = original === reopened && replayed === reopened && replayStep === 200;
      return { ok, detail: ok ? 'reopened and replayed runs match the original' : `original ${original}, reopened ${reopened}, replayed ${replayed} from step ${replayStep}` };
    },

    // Saving one dish again keeps one Archive entry with a snapshot per save; an older separate save of it folds in.
    async 'One Archive entry per dish'() {
      const dir = await savesFolder();
      await freshDish('s', 21);
      await foundAt(fx.a, .5, .5, .6); await idle();
      await DL.arenaAdvance(100); await saveDish(); await idle();
      await DL.arenaAdvance(100); await saveDish(); await idle();
      const mine = () => readDishes(dir).then(list => list.filter(x => x.meta.seed === 21));
      const after = await mine(), entry = after[0];
      const store = await dir.getDirectoryHandle('dishes'), meta = JSON.parse(await (await (await store.getFileHandle(entry.key + '.json')).getFile()).text());
      const oldId = 'dish-20200101-000000-aaaaaaaa';
      Object.assign(meta, { id: oldId, step: 40, createdAt: '2020-01-01T00:00:00.000Z' });
      delete meta.snapshots; delete meta.updatedAt;
      for (const [ext, body] of [['.json', JSON.stringify(meta)], ['.dldish', await (await store.getFileHandle(entry.key + '.dldish')).getFile()], ['.webp', await (await store.getFileHandle(entry.key + '.webp')).getFile()]]) {
        const w = await (await store.getFileHandle(oldId + ext, { create: true })).createWritable(); await w.write(body); await w.close();
      }
      const folded = await mine(), steps = folded[0]?.meta.snapshots.map(x => x.step).join(',');
      const ok = after.length === 1 && entry.meta.snapshots.length === 2 && folded.length === 1 && steps === '40,100,200';
      return { ok, detail: `${after.length} entry with ${entry.meta.snapshots.length} snapshots; after folding an older save, ${folded.length} entry with snapshots at ${steps}` };
    },

    // A specimen survives its file, and cutting the same body twice files it once.
    async 'Specimens: file and duplicates'() {
      const sp = fx.a, back = await unpackSpecimen(await packSpecimen(sp), specimenMeta(sp, 'test'));
      const same = back && back.agents.dx.every((v, i) => v === sp.agents.dx[i]) && back.crop.w === sp.crop.w && back.crop.h === sp.crop.h;
      await grow(FIXTURES.a);
      const before = DL.drawer.items.length;
      await cutSolo();
      const again = flashText;
      return { ok: same && DL.drawer.items.length === before && again === 'ALREADY IN THE DECK', detail: `file round trip ${same ? 'exact' : 'differs'}; second cut: ${again}, deck ${before} -> ${DL.drawer.items.length}` };
    },

    // Old colour-and-shape names are renamed once to strain names; a name typed by hand stays.
    async 'Old names renamed once'() {
      const root = await navigator.storage.getDirectory(), dir = await root.getDirectoryHandle('rename-test', { create: true });
      await grow(FIXTURES.a);
      const write = async (folder, name, data) => { const w = await (await folder.getFileHandle(name, { create: true })).createWritable(); await w.write(JSON.stringify(data)); await w.close(); };
      const save = { ...buildSave(st, R), name: 'Silver Web V', autoName: true }, hand = { ...buildSave(st, R), id: 'dl-hand', name: 'My Favorite' };
      await write(dir, save.id + '.json', save);
      await write(dir, 'dl-hand.json', hand);
      const specimens = await dir.getDirectoryHandle('specimens', { create: true });
      await write(specimens, 'sp-old.json', { format: 'digital-life-specimen', version: 3, kind: 'cut', id: 'sp-old', name: 'Silver Web V (A)', createdAt: '2020-01-01T00:00:00.000Z', source: { saveId: save.id, name: 'Silver Web V' } });
      const first = await renameAll(dir), second = await renameAll(dir);
      const read = async (folder, name) => JSON.parse(await (await (await folder.getFileHandle(name)).getFile()).text());
      const s = await read(dir, save.id + '.json'), h = await read(dir, 'dl-hand.json'), c = await read(specimens, 'sp-old.json');
      const ok = isStrainName(s.name) && s.formerName === 'Silver Web V' && h.name === 'My Favorite' && c.name === s.name + ' A' && c.source.name === s.name && first === 2 && second === 0;
      await root.removeEntry('rename-test', { recursive: true });
      return { ok, detail: `save -> ${s.name}, cut -> ${c.name}, typed name -> ${h.name}, changed ${first} then ${second}` };
    },

    // Every control that offers help has its text, in every room and Archive view.
    // The cell finder on a drawn grid: a ring with a body inside, a big ring holding a small one, and an open arc. It
    // must find the three closed cells and not the arc, keep the small cell apart from the big one, and see the bodies
    // inside. Then on a real dish: looking for cells only reads it, so the dish runs exactly the same.
    async 'Cells: found, kept apart, read only'() {
      const G = makeCellGrid(96, 96, 46), light = new Float32Array(G.N).fill(.05), wrong = [];
      const draw = (cx, cy, r, gap = 0) => {
        for (let k = 0; k < G.N; k++) {
          const x = k % 96 + .5, y = Math.floor(k / 96) + .5, d = Math.hypot(x - cx, y - cy);
          if ((r ? Math.abs(d - r) < 1 : d < 1.6) && !(gap && Math.abs(Math.atan2(y - cy, x - cx)) < gap / 2)) light[k] = .9;
        }
      };
      draw(28, 30, 9); draw(28, 30, 0); draw(60, 62, 12); draw(60, 62, 4); draw(26, 70, 8, 1.2);
      const found = await findCells(G, light), at = (x, y) => found.filter(c => c.r.set.has(y * 96 + x)).sort((a, b) => a.r.area - b.r.area)[0];
      const bodies = c => c ? measureCell(G, light, new Uint8Array(G.N), c, []).organelles : -1;
      if (found.length !== 3) wrong.push(`${found.length} cells found, expected 3`);
      if (bodies(at(28, 30)) < 1) wrong.push('the body inside the ring was missed');
      const big = at(51, 62), small = at(60, 62);
      if (!big || !small || big === small) wrong.push('the small ring was not kept apart from the big one');
      else if (bodies(big) < 1 || bodies(small) !== 0) wrong.push(`bodies: big ${bodies(big)}, small ${bodies(small)}`);
      if (found.some(c => c.r.set.has(70 * 96 + 26 - 8))) wrong.push('the open arc was taken for a cell');
      const list = [...found[0].r.cells].sort((a, b) => a - b);
      if (cellsFromRuns(cellRuns(list)).join() !== list.join()) wrong.push('outline does not survive saving');
      const run = async look => {
        await freshDish('s', 31);
        await foundAt(fx.a, .5, .5, 1); await idle();
        await foundAt(fx.b, .3, .45, .5); await idle();
        cellScope.nextStep = Infinity;
        for (let i = 0; i < 2; i++) { await DL.arenaAdvance(150); if (look) await lookForCells(); }
        return [await dishHash(), cellScope.tracks.length];
      };
      const [plain] = await run(false), [looked, followed] = await run(true);
      if (plain !== looked) wrong.push('looking for cells changed the dish');
      return { ok: !wrong.length, detail: wrong.length ? wrong.join('; ') : `3 drawn cells found, arc ignored; dish unchanged by looking (${followed} outlines followed)` };
    },

    // The Incubator console holds still: with no cells, one or three, and with CELLS on or off, the sliders and the chart
    // stay where they are; while pointed at, the cell list keeps its cells even when the ranking changes.
    async 'Console holds still'() {
      await freshDish('s', 31);
      const wrong = [], top = id => Math.round($(id).getBoundingClientRect().top);
      const fake = (id, score) => ({ id, name: 'EU-' + id, score, born: 0, seen: true, green: score >= .8, eu: true, history: [{}, {}, {}], strains: 1, mix: [{ lineage: 0, share: 1 }], r: { x0: 10 + id * 8, x1: 14 + id * 8, y0: 10, y1: 14, area: 25 } });
      const sliders = top('arenaSliders');
      setCellsShown(true); cellScope.nextStep = Infinity; cellScope.step = 600;
      if (top('arenaSliders') !== sliders) wrong.push('turning CELLS on moved the sliders');
      const chart = [];
      for (const n of [0, 1, 3]) {
        cellScope.tracks = [fake(1, .9), fake(2, .7), fake(3, .5)].slice(0, n);
        renderCellPanel(); await sleep(30);
        chart.push(top('arenaChart'));
      }
      if (new Set(chart).size !== 1) wrong.push(`the chart moved: ${chart.join(', ')}`);
      const host = $('cellTop'), names = () => [...host.querySelectorAll('.cell-head b')].map(b => b.textContent).join(',');
      host.dispatchEvent(new PointerEvent('pointerenter'));
      const held = names();
      cellScope.tracks[2].score = .99; renderCellPanel();
      if (names() !== held) wrong.push('the list re-sorted while pointed at');
      host.dispatchEvent(new PointerEvent('pointerleave'));
      if (!names().startsWith('EU-3')) wrong.push('the list did not sort again after the pointer left');
      resetCells(); setCellsShown(false);
      if (top('arenaSliders') !== sliders) wrong.push('turning CELLS off moved the sliders');
      return { ok: !wrong.length, detail: wrong.length ? wrong.join('; ') : `sliders and chart still with 0, 1 and 3 cells; list held while pointed at (${held})` };
    },

    // Food is the dish's only source of energy. With none growing back, everything the dish holds (the food in the broth,
    // the energy its particles store, and the matter they are made of) must fall by at least what living costs.
    async 'Energy only comes from food'() {
      await freshDish('s', 31);
      Object.assign(arena.params, { patches: .5, foods: 2 });
      await foundAt(fx.a, .5, .5, 1); await idle();
      await foundAt(fx.b, .3, .45, .5); await idle();
      const regrow = ARENA.regrow;
      ARENA.regrow = 0;
      try {
        const s = arena.sim, n = s.q.agents, { gw, gh } = arena.d, hunger = arena.params.hunger;
        const held = async () => {
          const pos = new Float32Array(await readBack(s.agentBuf, n * 16)), gf = new Float32Array(await readBack(arena.genes, n * 64));
          let alive = 0, energy = 0, upkeep = 0;
          for (let i = 0; i < n; i++) if (pos[i * 4] >= 0) { alive++; energy += Math.max(gf[i * 16], 0); upkeep += hunger * (.0004 + .00025 * gf[i * 16 + 5] + .00015 * gf[i * 16 + 6]); }
          const food = await readRegion(s.field[arena.fcur], 0, 0, gw, gh);
          let broth = 0;
          for (let k = 0; k < gw * gh; k++) broth += food[k * 4 + 1] + (arena.params.foods === 2 ? food[k * 4 + 3] : 0);
          return { all: energy + broth + .3 * alive, upkeep };
        };
        await DL.arenaAdvance(50);
        const a = await held();
        await DL.arenaAdvance(300);
        const b = await held(), lost = a.all - b.all, least = .9 * Math.min(a.upkeep, b.upkeep) * 300;
        return { ok: lost >= least, detail: `held ${a.all.toFixed(0)} -> ${b.all.toFixed(0)}: lost ${lost.toFixed(0)}, living cost at least ${least.toFixed(0)}` };
      } finally { ARENA.regrow = regrow; }
    },

    // A dish saved when food grew back twice as fast opens with its FOOD doubled (to at most 1), so it gets the same
    // food; a dish saved since keeps its FOOD as it is.
    async 'Older dishes keep their food'() {
      await freshDish('s', 31);
      await foundAt(fx.a, .5, .5, 1); await idle();
      arena.params.food = .3;
      await DL.arenaAdvance(20);
      await saveDish(); await idle();
      const dir = await (await navigator.storage.getDirectory()).getDirectoryHandle('dishes');
      const meta = JSON.parse(await (await (await dir.getFileHandle(arena.dishId + '.json')).getFile()).text());
      const file = await (await dir.getFileHandle(arena.dishId + '.dldish')).getFile();
      const older = { ...meta, params: { ...meta.params }, regrow: undefined };
      await restoreDish(older, file);
      const opened = arena.params.food;
      await restoreDish(meta, file);
      const kept = arena.params.food;
      arena.origin = null; arena.dishId = null;
      return { ok: opened === .6 && kept === .3, detail: `older dish at FOOD 0.3 opens at ${opened}; a new one stays at ${kept}` };
    },

    // The ECOSYSTEM score. On made-up histories: strains trading ground in a steady dish of separate bodies score high; the
    // same dish spread into an even mush, a crashing dish, one whose strains never move, and one too short to judge do
    // not. On a real dish: once 3,000 steps of census history exist, it shows beside the dish and is saved with it.
    async 'Ecosystem score'() {
      const wrong = [], make = (n, f, clump = .85) => Array.from({ length: n }, (_, j) => ({ step: j * 150, counts: f(j), clump }));
      const trade = j => [1000 + 200 * Math.sin(j / 2), 1000 - 200 * Math.sin(j / 2), 1000 + 150 * Math.cos(j / 3), 1000 - 150 * Math.cos(j / 3)];
      const trading = ecoScore(make(25, trade), 12000, 4), mush = ecoScore(make(25, trade, .25), 12000, 4);
      const crash = ecoScore(make(25, j => [1000 * (1 - j / 30), 900 * (1 - j / 30), 800, 700]), 12000, 4);
      const frozen = ecoScore(make(25, () => [1000, 1000, 1000, 1000]), 12000, 4);
      const short = ecoScore(make(5, j => [1000 + j, 1000 - j, 1000, 1000]), 12000, 4);
      if (!(trading?.score >= 80)) wrong.push('trading dish scored ' + trading?.score);
      if (!(mush?.score < 30)) wrong.push('mush dish scored ' + mush?.score);
      if (!(crash?.score < 30)) wrong.push('crashing dish scored ' + crash?.score);
      if (frozen?.score !== 0) wrong.push('frozen dish scored ' + frozen?.score);
      if (short !== null) wrong.push('a short history was scored');
      await freshDish('s', 31);
      await foundAt(fx.a, .5, .5, 1); await idle();
      await foundAt(fx.b, .3, .45, .5); await idle();
      for (let i = 0; i < 24; i++) { await DL.arenaAdvance(150); await census(); }
      const eco = dishEcosystem(), shown = $('ihudEco').textContent.trim();
      if (!eco) wrong.push('no score after 3,600 steps');
      await saveDish(); await idle();
      const meta = JSON.parse(await (await (await (await (await navigator.storage.getDirectory()).getDirectoryHandle('dishes')).getFileHandle(arena.dishId + '.json')).getFile()).text());
      if (!meta.ecosystem || !Number.isFinite(meta.ecosystem.score)) wrong.push('not saved with the dish');
      arena.dishId = null;
      return { ok: !wrong.length, detail: wrong.length ? wrong.join('; ') : `made-up dishes: trading ${trading.score}, mush ${mush.score}, crashing ${crash.score}, frozen 0; real dish ${eco.score} (shown ${shown}), saved` };
    },

    // PATCHES and FOODS. In an empty dish whose food was cleared, food grows back evenly at PATCHES 0, and in patches at
    // 0.8 with the same total, which later sit elsewhere. With two foods, particles' diets differ and both foods are eaten.
    async 'Patches and two foods'() {
      const wrong = [];
      await freshDish('s', 31);
      const s = arena.sim, { gw, gh } = arena.d;
      const regrown = async (patches, clock) => {
        resetArena();
        Object.assign(arena.params, { patches, foods: 1 });
        const empty = new Float32Array(gw * gh * 4);
        for (let i = 0; i < gw * gh; i++) empty[i * 4 + 3] = 1;
        for (const t of s.field) device.queue.writeTexture({ texture: t }, empty, { bytesPerRow: gw * 16 }, [gw, gh]);
        device.queue.writeBuffer(arena.econ, arena.d.econ.clock * 4, new Uint32Array([clock]));
        await DL.arenaAdvance(64);
        const f = await readRegion(s.field[arena.fcur], 0, 0, gw, gh), v = [];
        for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (Math.hypot(x + .5 - gw / 2, y + .5 - gh / 2) < gh / 2 - 4) v.push(f[(y * gw + x) * 4 + 1]);
        const m = v.reduce((a, b) => a + b, 0) / v.length;
        return { v, mean: m, cv: Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length) / m };
      };
      const even = await regrown(0, 0), patchy = await regrown(.8, 0), later = await regrown(.8, 15000);
      if (even.cv > .05) wrong.push(`food grew unevenly at PATCHES 0 (${even.cv.toFixed(2)})`);
      if (patchy.cv < .3) wrong.push(`patches barely show (${patchy.cv.toFixed(2)})`);
      if (Math.abs(patchy.mean / even.mean - 1) > .15) wrong.push(`patches changed the total food (${(patchy.mean / even.mean).toFixed(2)})`);
      const moved = patchy.v.reduce((t, x, i) => t + Math.abs(x - later.v[i]), 0) / patchy.v.reduce((a, b) => a + b, 0);
      if (moved < .3) wrong.push(`the patches did not move (${moved.toFixed(2)})`);
      await freshDish('s', 31);
      Object.assign(arena.params, { patches: .5, foods: 2 });
      await foundAt(fx.a, .5, .5, 1); await idle();
      await foundAt(fx.b, .3, .45, .5); await idle();
      await DL.arenaAdvance(900);
      const n = s.q.agents, pos = new Float32Array(await readBack(s.agentBuf, n * 16)), gu = new Uint32Array(await readBack(arena.genes, n * 64));
      let lo = 1, hi = 0;
      for (let i = 0; i < n; i++) if (pos[i * 4] >= 0) { const d = ((gu[i * 16 + 15] >>> 6) & 0x3FF) / 1023; lo = Math.min(lo, d); hi = Math.max(hi, d); }
      if (hi - lo < .05) wrong.push('every particle has the same diet');
      const f = await readRegion(s.field[arena.fcur], 0, 0, gw, gh);
      let a = 0, b = 0, cells = 0;
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (Math.hypot(x + .5 - gw / 2, y + .5 - gh / 2) < gh / 2 - 4) { a += f[(y * gw + x) * 4 + 1]; b += f[(y * gw + x) * 4 + 3]; cells++; }
      if (a / cells > .995 || b / cells > .995) wrong.push(`a food was not eaten (first ${(a / cells).toFixed(3)}, second ${(b / cells).toFixed(3)})`);
      return { ok: !wrong.length, detail: wrong.length ? wrong.join('; ') : `even ${even.cv.toFixed(2)}, patchy ${patchy.cv.toFixed(2)} with ${Math.round(patchy.mean / even.mean * 100)}% of the food, moved ${Math.round(moved * 100)}%; diets ${lo.toFixed(2)} to ${hi.toFixed(2)}, foods left ${(a / cells).toFixed(2)} and ${(b / cells).toFixed(2)}` };
    },

    // Homing and crowding are inherited and mutate in a new dish, stay 1 in an older one, come along when a body is kept
    // and placed again, and start at 1 for a kept specimen saved before they existed.
    async 'Inherited cohesion'() {
      const wrong = [];
      const multipliers = async () => {
        const n = arena.sim.q.agents, pos = new Float32Array(await readBack(arena.sim.agentBuf, n * 16)), gu = new Uint32Array(await readBack(arena.genes, n * 64));
        const h = [], c = [];
        for (let i = 0; i < n; i++) if (pos[i * 4] >= 0) { h.push(((gu[i * 16 + 1] >>> 8) & 0xFFF) / 1023); c.push((gu[i * 16 + 1] >>> 20) / 1023); }
        const mean = a => a.reduce((x, y) => x + y, 0) / a.length, spread = a => Math.max(...a) - Math.min(...a);
        return { n: h.length, homing: mean(h), crowding: mean(c), spread: Math.max(spread(h), spread(c)) };
      };
      const run = async cohesion => {
        await freshDish('s', 31);
        Object.assign(arena.params, { cohesion });
        await foundAt(fx.a, .5, .5, 1); await idle();
        await foundAt(fx.b, .3, .45, .5); await idle();
        await DL.arenaAdvance(1500);
        return multipliers();
      };
      const fixed = await run(0), inherited = await run(1);
      if (fixed.spread !== 0 || fixed.homing !== 1 || fixed.crowding !== 1) wrong.push(`an older dish changed them (${JSON.stringify(fixed)})`);
      if (inherited.spread < .05) wrong.push('they did not mutate');
      if (Math.abs(inherited.homing - 1) > .2 || Math.abs(inherited.crowding - 1) > .2) wrong.push(`they wandered too far in 1,500 steps (${inherited.homing.toFixed(2)}, ${inherited.crowding.toFixed(2)})`);
      // Keep the densest body, then place it again in a fresh dish: its particles bring their own homing and crowding.
      await census();
      const f = arena.founders[0], big = f.track.bodies.reduce((m, b) => b.mass > m.mass ? b : m);
      await keepAt(big.cx, big.cy, Math.min(big.r, .25)); await idle();
      const kept = DL.drawer.items[0].specimen, kn = kept.agents.dx.length;
      let kh = 0, lo = 4, hi = 0;
      for (let j = 0; j < kn; j++) { const v = kept.genes[j * GENE_IN + 24]; kh += v / kn; lo = Math.min(lo, v); hi = Math.max(hi, v); }
      await freshDish('s', 31);
      Object.assign(arena.params, { drift: 0 });
      await foundAt(kept, .5, .5, 1); await idle();
      const placed = await multipliers();
      if (!placed.n) wrong.push('the kept body was not placed');
      if (hi - lo < .02 || Math.abs(placed.homing - kh) > .01 || placed.spread < hi - lo - 1e-6) wrong.push(`a kept body lost its homing (${kh.toFixed(3)} from ${lo.toFixed(2)} to ${hi.toFixed(2)} kept, ${placed.homing.toFixed(3)} placed, spread ${placed.spread.toFixed(2)})`);
      // A kept specimen file from before homing and crowding: 24 numbers a particle.
      const raw = await new Response((await packSpecimen(kept)).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      const words = new Uint32Array(raw), start = words.length - kn * GENE_IN, old = new Uint32Array(start + kn * 24);
      old.set(words.subarray(0, start));
      for (let j = 0; j < kn; j++) old.set(words.subarray(start + j * GENE_IN, start + j * GENE_IN + 24), start + j * 24);
      old[6] = 24;
      const back = await unpackSpecimen(await new Response(new Blob([old]).stream().pipeThrough(new CompressionStream('gzip'))).blob(), specimenMeta(kept, 'old'));
      const ok24 = back && back.genes.length === kn * GENE_IN && [...Array(kn).keys()].every(j => back.genes[j * GENE_IN + 24] === 1 && back.genes[j * GENE_IN + 25] === 1 && back.genes[j * GENE_IN + 7] === kept.genes[j * GENE_IN + 7]);
      if (!ok24) wrong.push('an older kept specimen did not open with homing and crowding at 1');
      Object.assign(arena.params, defaults(ARENA_PARAMS));
      return { ok: !wrong.length, detail: wrong.length ? wrong.join('; ') : `older dish all 1; new dish after 1,500 steps homing ${inherited.homing.toFixed(3)}, crowding ${inherited.crowding.toFixed(3)}, spread ${inherited.spread.toFixed(2)}; a kept body brings its own (${lo.toFixed(2)} to ${hi.toFixed(2)}); older files open at 1` };
    },

    // TEST sets the dish aside and puts it back exactly, measures a specimen the same way every time, and describes it.
    async 'Specimen test'() {
      const wrong = [];
      const start = async () => {
        await freshDish('s', 31);
        await foundAt(fx.a, .5, .5, 1); await idle();
        await foundAt(fx.b, .3, .45, .5); await idle();
        await DL.arenaAdvance(200);
      };
      await start();
      await DL.arenaAdvance(300);
      const plain = await dishHash();
      // Every particle place, and the genes of every living particle (an empty place gets new genes when one is born there).
      const held = async () => {
        const n = arena.sim.q.agents, pos = new Float32Array(await readBack(arena.sim.agentBuf, n * 16)), gu = new Uint32Array(await readBack(arena.genes, n * 64)), live = [];
        for (let i = 0; i < n; i++) if (pos[i * 4] >= 0) live.push(...gu.subarray(i * 16, i * 16 + 16));
        return (await dishHash()) + '-' + fnv(new Uint8Array(Uint32Array.from(live).buffer));
      };
      await start();
      const before = await held();
      const founders = arena.founders, items = [{ meta: { name: 'A' }, specimen: fx.a }, { meta: { name: 'A again' }, specimen: fx.a }];
      await testSpecimens(items);
      if (arena.founders !== founders || arena.sim.step !== 200 || arena.busy) wrong.push('the dish was not put back as it was');
      if (await held() !== before) wrong.push('the dish put back holds different particles or genes');
      await DL.arenaAdvance(300);
      if (await dishHash() !== plain) wrong.push('the dish runs differently after the test');
      const [a, b] = items.map(x => x.meta.behavior);
      const same = a && b && ['travel', 'grows', 'pieces', 'fill', 'holes', 'hole', 'stretch', 'field'].every(k => a[k] === b[k]);
      if (!same) wrong.push(`two tests differ: ${JSON.stringify(a)} and ${JSON.stringify(b)}`);
      if (a && !behaviorCurrent(items[0].meta)) wrong.push('a fresh result counts as untested');
      // Made-up results read as they should.
      const line = r => behaviorLine({ behavior: { rules: BEHAVIOR.rules, ...r } });
      const ring = { travel: 40, grows: 1, pieces: 1, fill: .4, holes: 1, hole: .6, stretch: 1.1, field: 0 };
      const expect = [
        [ring, 'Forms a ring, stays put and keeps its size.'],
        [{ ...ring, fill: .9, holes: 0, hole: 0, travel: 800, grows: .1 }, 'Holds together as one solid body, travels far and loses most of its particles.'],
        [{ ...ring, holes: 9, hole: .1, grows: .6, field: .8 }, 'Forms a net, stays put and slims down; its reaction field fills most of the dish.'],
        [{ ...ring, pieces: 7, travel: 200, grows: 3.2 }, 'Breaks into many small bodies, drifts and grows 3 times over.'],
        [{ ...ring, pieces: 2, inside: 1, travel: 400, grows: .4 }, 'Forms a ring around another body, wanders and shrinks to under half its size.'],
        [{ ...ring, pieces: 0, grows: 0 }, `Dies out alone within ${BEHAVIOR.steps.toLocaleString('en-US')} steps.`],
        [{ ...ring, pieces: 0, grows: .6 }, 'Spreads out thinly, stays put and slims down.'],
      ];
      for (const [r, want] of expect) { const got = line({ steps: BEHAVIOR.steps, ...r }); if (got !== want) wrong.push(`"${got}" should read "${want}"`); }
      if (behaviorLine({ behavior: { ...ring, rules: BEHAVIOR.rules - 1 } }) === line(ring)) wrong.push('an out-of-date result is shown as current');
      return { ok: !wrong.length, detail: wrong.length ? wrong.join('; ') : `the dish came back exactly; ${fx.a.name}: "${behaviorLine(items[0].meta)}"` };
    },

    async 'Every help label has its text'() {
      const keys = new Set(), take = () => document.querySelectorAll('[data-help]').forEach(e => keys.add(e.dataset.help));
      DL.goRoom('lab'); await sleep(200); take();
      DL.setMode('batch'); await sleep(1500); take();
      DL.setMode('solo'); await sleep(200);
      DL.goRoom('incubator'); await sleep(300); take();
      await openLibrary(); await sleep(500);
      for (const [view, slides] of [['slides', 'grid'], ['slides', 'tree'], ['specimens'], ['dishes']]) { setLibView(view, slides); await sleep(300); take(); }
      closeLibrary(); await sleep(300);
      const missing = [...keys].filter(k => !HELP[k]);
      return { ok: !missing.length, detail: missing.length ? 'missing: ' + missing.join(', ') : `${keys.size} labels, all with text` };
    },
  };

  // Fingerprints recorded on the development machine (NVIDIA RTX 40-series). Another GPU may differ; the checks that
  // compare two runs still hold there. The dish's changed on purpose when the strain cap was removed, and again when
  // energy was made to come only from food and food was rescaled to limit growth, and when digestion came to need a
  // minimum density of kin.
  const EXPECTED = { dish: 'd0bdfa5c-7e209c9d-c1f8197c-91d72f21-783f0a3d' };
  const FIXTURES = {
    a: { quality: 'med', seed: 12345, init: 'scatter', count: 1, eco: null, hybrid: 'off', steps: 600 },
    b: { quality: 'med', seed: 6060, init: 'out', count: 3, eco: 'cycle', hybrid: 'cells', steps: 600 },
  };

  window.__suite = {
    names: Object.keys(checks),
    // A folder for the app in private storage, allowed the way a person would allow it, and the two test organisms.
    async setup() {
      const fault = document.getElementById('fault');
      if (!fault.hidden) return { ok: false, detail: fault.textContent };
      const root = await navigator.storage.getDirectory();
      for await (const [name] of root.entries()) await root.removeEntry(name, { recursive: true });
      window.showDirectoryPicker = async () => root;
      DL.pause();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', bubbles: true }));
      await sleep(1000);
      if ($('savesDialog').open) { $('savesPick').click(); await sleep(1000); if (!$('savesUseAnyway').hidden) $('savesUseAnyway').click(); }
      for (let i = 0; i < 100 && !DL.lib.open; i++) await sleep(100);
      closeLibrary(); await sleep(300);
      await grow(FIXTURES.a); fx.a = await cutSolo();
      await grow(FIXTURES.b); fx.b = await cutSolo();
      return { ok: !!(fx.a && fx.b), detail: `organisms cut: ${fx.a?.agents.dx.length} and ${fx.b?.agents.dx.length} particles` };
    },
    async run(name) {
      try {
        const r = await checks[name]();
        const fault = document.getElementById('fault');
        if (!fault.hidden) return { ok: false, detail: 'GPU fault: ' + fault.textContent };
        return r;
      } catch (e) { return { ok: false, detail: String(e && e.stack || e) }; }
    },
  };
  return 'suite ready: ' + Object.keys(checks).length + ' checks';
})()
