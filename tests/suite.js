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
    Object.assign(arena.params, defaults(ARENA_PARAMS));
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
    async 'Incubator fingerprint'() {
      const run = async () => {
        await freshDish('s', 31);
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
  // compare two runs still hold there.
  const EXPECTED = { dish: '9d775dbf-e9a60af1-ee81feb0-b2c9048c-af02ae70' };
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
