# Changelog

What changed, newest first. Each entry is a commit on `main`.

## Unreleased

- **No strain cap.** The rule that held each strain near the size it was placed at counted the whole strain across
  the dish, the one rule that looked beyond a single particle, so it is gone. Strains now grow as far as food and room
  allow. Runs of all eight saved dishes with it off kept their cells (docs/RESEARCH.md, "Which rules carry the cells"),
  and RANDOMIZE's ranges still keep every strain alive. Old dishes open as saved and carry on without it; the Incubator
  fingerprint test has a new recorded value. HOMEOSTASIS now sets only the particle rules.
- **Square pictures and films of the Incubator.** IMAGE, CLIP and RECORD save just the dish in its porthole, bezel
  and tick marks included, as a square; the readouts no longer appear in them.
- **The readouts beside the dish say what they are.** MOTES is now PARTICLES, like everywhere else, and each readout
  has a short line under it and a help card. Help cards were tightened, with the older words lineage and world
  replaced by strain and dish.
- **A steadier Incubator console.** Controls come first and live readouts after: CELLS and its list now sit below the
  settings sliders. The best-cells list keeps three slots of one height, so nothing below it moves as cells come and
  go, and while you point at it the list holds its order. Pointing at a slot lights its cell in the dish; cell labels
  stay inside the glass. The README shows the cells found in Consortium L-848.

## 2026-11-26

- **Find cells in the Incubator, keep them as specimens** (1ed840b). CELLS: SHOW boxes the cell-like structures that
  form in a dish, each with an EU or PR name and a score that rewards a closed wall, an inside that keeps its particles
  and keeps moving, bodies and strains inside, and age; a box turns green for an EU cell at 80% or more. The dish lists its three best cells, follows its
  cells whether or not they are shown, and keeps them with a saved dish. KEEP CELL files a cell as a specimen cut along
  its own outline. The KEEP ring is sized with the scroll wheel, and the CIRCLE row is gone. Clicking a strain row
  flips the deck to its card. REMOVE, above the deck, takes out the card in front.

## 2026-11-25

- **Show real dishes in the README's pictures** (f37c2c8).
- **Clean up: tests in the repo, one vocabulary, split docs, new pictures** (405afd7), with no change to how anything
  runs: the test suite moved into the repo (`tests/run.ps1`), the screen uses one set of names (Incubator, Archive,
  strain, deck) and the code keeps a glossary of its older ones, the README split into a front page, a guide, an
  architecture note and this changelog, the format upgrades sit in one section, and the old colour-word naming code is
  gone.
- Fixed: cutting the same body from an unsaved organism twice could file it twice; the menu's underline had a help
  label with no text.
- **Keep one Archive entry per dish, split the Archive into SLIDES and LIVING** (061a658). Saving a dish again updates
  its entry and adds a round snapshot that plays on hover; earlier separate saves of one dish fold together. SLIDES has
  a GRID / TREE switch; SPECIMENS and DISHES are grouped as LIVING. The Incubator lost its WORLD row, help works
  everywhere, and RANDOMIZE and DEFAULT set the dish's settings within safe ranges.
- **Name living things like lab strains, fix cropped cuts, frame recordings** (8558d47). Names such as
  "Reticulum T-182"; older names renamed once and kept. Long bodies keep both ends when cut; duplicate specimens are
  removed; Incubator recordings show the porthole and readouts.
- **Add larger Incubator dishes, zoom, and saved dishes in the Archive** (4958fe0). 1×, 1.5× and 2× dishes with
  specimens at true size, zoom and drag, copies down to a third, and whole dishes saved and reopened exactly.

## 2026-11-24

- **Carry a body's reaction field into the Incubator** (7f196ca).
- **Keep cut bodies whole in the Incubator, add CUT everywhere and a specimen deck** (610d5bb). A chemical of its own
  for each species, food that reaches dense bodies, strains that keep their size, and the bench's steadiness check.
- **Give each organism its own colors, add the SHAPE start, fix regrowing** (00ee65c).
- **Add a specimen drawer and placing many sized copies** (e4da10f).
- **Cut specimens along the bodies they hold** (d10fa3a).
- **Redesign the app as a culture lab with three rooms** (2c99f04).
- **Stop the Library from waiting forever on folder permission** (fbe753e).
- **Keep the Library and simulation from stalling, and name the GPU** (e6ceb77).
- **Make Arena homeostasis hold bodies together** (59d1851).
- **Make the Arena easier to use and measure individuals** (b6f3a6a).
- **Add the Arena and LIFE score version 2** (187fd2d).
- **Fix Library grid scrolling and hide removed saves from the tree** (20e3cfb).

## 2026-11-23

- **Make saves clearer: full-body saves, no duplicates, automatic names** (6fdfc23).
- **Fix stuck barriers and add an empty sandbox control** (93978d6).
- **Add structural inheritance and early-life systems** (07ac0d7).
- **Initial commit of Digital Life Sandbox** (1437501).
