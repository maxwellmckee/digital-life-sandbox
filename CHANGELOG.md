# Changelog

What changed, newest first. Each entry is a commit on `main`.

## Unreleased

- **Cells in the Incubator.** CELLS: SHOW boxes the cell-like structures that form in a dish, each with an EU or PR
  name and a score that rewards a closed wall, an inside that keeps its particles and keeps moving, bodies and strains
  inside, and age; a box turns green for an EU cell at 80% or more. The dish lists its three best cells, follows its
  cells whether or not they are shown, and keeps them with a saved dish. KEEP CELL files a cell as a specimen cut along
  its own outline.
- The KEEP ring is sized with the scroll wheel, and the CIRCLE row is gone. Clicking a strain row flips the deck to its
  card. REMOVE, above the deck, takes out the card in front.
- Cleanup, with no change to how anything runs: the test suite moved into the repo (`tests/run.ps1`), the screen uses one
  set of names (Incubator, Archive, strain, deck) and the code keeps a glossary of its older ones, the README split into
  a front page, a guide, an architecture note and this changelog, the format upgrades sit in one section, and the old
  colour-word naming code is gone.
- Fixed: cutting the same body from an unsaved organism twice could file it twice; the menu's underline had a help
  label with no text.

## 2026-11-25

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
