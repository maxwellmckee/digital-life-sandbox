# Architecture

How Digital Life Sandbox works inside, for anyone changing it, including future Claude sessions. The whole app is one
self-contained file, `digital_life.html`, with no build step and no dependencies. For how to use it, see
[GUIDE.md](GUIDE.md).

## Rules for future changes

1. **Protect determinism.** A seed and settings must reproduce a run exactly. Deposits use atomic fixed-point math and each agent has its own random stream. New features must have no effect when unused.
2. **Never test against real saves.** Use copies or browser-private storage (OPFS). Do not modify `saves/`, `images/` or `videos/`.
3. **Keep it one self-contained HTML file** unless there is a deliberate decision to change that.
4. **Keep the interface simple.** It pairs a dot-matrix lab instrument with light that fades like the organisms' trails. Follow [DESIGN.md](DESIGN.md). Too many options is a known concern, so explain new controls in the Help system.
5. **Change one thing at a time** and test it on the GPU.
6. **Run the tests** before and after a change: `.\tests\run.ps1` (see [Testing](#testing)).
7. **Keep older files opening.** A format change needs an upgrade in the "Keeping old files working" section and a check
   in `tests/suite.js`.

## How the file is laid out

The script opens with a map of its sections. In order: configuration; shaders (the Microscope's, then the Incubator
dish's, then the picture passes); state and GPU setup; barriers, the organism brush and inherited bodies; simulation and
rendering; the dot-matrix display and the lab look; metrics; family records, undo, genomes and breeding; random
founders and taste learning; help; saving and loading; the Archive; the Incubator's dish; the cutting bench, specimens,
saved dishes, cells and the specimen deck; export; the draw page; actions and the interface; keeping old files working; the
debug handle; boot.

### Words on screen and in the code

Some things kept their earlier names in the code. The screen always uses the first column.

| On screen | In the code |
|---|---|
| Incubator, its dish | `arena`, `arena.sim`, mode `'arena'` |
| Strain | founder, `arena.founders` |
| Specimen deck | `drawer` |
| Archive | library, `lib` |
| Slide (a saved organism) | save |
| LIVING (specimens and dishes) | `lib.specimens`, `lib.dishes` |
| KEEP | `keepAt`, `beginKeeping` |
| Cells, KEEP CELL | `cellScope.tracks` (one track per cell), `keepCell` |
| EMPTY | `arenaClear` |

## How it works

**Simulation.** Each agent senses trail ahead, left and right, steers, moves and deposits. The trail map then blurs and fades. All of this runs in WebGPU compute shaders.

| Quality | Trail map | Agents |
|---|---|---|
| LOW and Batch tiles | 960x540 | 125,000 |
| MED | 1920x1080 | 500,000 |
| HIGH | 2560x1440 | 900,000 |

**Key systems in `digital_life.html`:**

- **Species:** up to 3, stored as index ranges in one agent buffer, with a follow/avoid matrix (RIVAL, ALLY, CHASE, CYCLE).
- **Reaction field:** Gray-Scott on a fixed 480x270 grid (CORAL, MAZE, CELLS, WAVES). In the Incubator the grid grows with the dish, one cell per 4 pixels.
- **Barriers:** smoothed strokes rasterized to a fixed 1920x1080 mask and drawn as vector art with a perforated finish. Agents bounce off, and trail and chemical cannot enter.
- **Organism brush:** timed events stored in the genome and applied between simulation steps. A negative position marks an agent as parked in reserve, which is how BLANK works.
- **Bodies:** full GPU copies of agents, trail, veins, chemical and genes, up to 1.5 GB with the oldest released first. `placeState` moves them between quality levels.
- **Veins:** stored in the trail texture's alpha channel as 1 minus vein strength, so a plain map means no veins.
- **Living cells:** a four-stage compute step of claim, birth, live and clear, with a separate 32-byte gene record per agent. Atomic claims keep runs repeatable.
- **Rendering:** per-species gradient lookup, bloom, ACES tone mapping and fine grain. A picture shown smaller than its own size is sampled four times per screen pixel, so fine trails don't shimmer, and the Incubator's zoom is a window into that picture.
- **Metrics:** a GPU probe produces the LIFE score and verdicts ALIVE, NOISE, GRID, BLOB, FLAT or EMPTY. New variants get four checkpoints because good organisms can start slowly. Version 2 adds coarse-scale bodies, block variety, border share and edge direction.
- **Food:** the food grid holds two foods in one texture (green and alpha) with their rations for the step (red and blue). Sunlight comes from a small uniform: PATCHES, how many foods, and four orbiting patches per food from the dish's seed, scaled so each averages 1. The patches move with a step counter kept on the GPU (the last word of the counter buffer, advanced by the clear pass and set from the saved step when a dish is opened), so they move the same way however the steps are batched. A particle's diet lives in bits 6 to 15 of its field word (the recipe number takes the low six) and, when placing, in the 24th of the plain gene numbers. With one food, eating and birth take exactly the path they did before, so older dishes run unchanged.
- **Predation:** each particle has a second gene record (`genesB`, four numbers: hunting, kin mark and two spare), bound beside the 64-byte genes, which are full. While HUNTING is above 0, three passes run after birth: *occupy* (each particle marks its 2-pixel patch on a grid in the counter buffer, the highest-numbered winning), *bite* (a hunter asks a bite of whatever stands on the patch just ahead of it, scaled by its hunting and by how far apart their kin marks are) and *defend* (the bitten particle gives what it is asked, up to its energy, less the more kin surround it, and notes the share it gave). In *live* each hunter takes half its share; *clear* empties the grid and the four per-particle counters. The bite, the hunter's share, how fully kin guard and how hard hunters are drawn to strangers are `ARENA.predation`, written into the dish's shaders when they are built. Every count is an integer added atomically and the patch's winner is the highest number, so runs stay exact. At HUNTING 0 none of this runs and birth draws nothing more. When placing, hunting and the kin mark are the 27th and 28th plain gene numbers (`GENE_IN` is 28); a placed particle's hunting comes from a random stream of its own, and its kin mark from its strain's.
- **Inherited cohesion:** each particle's homing and crowding, multiples of HOMEOSTASIS from 0 to 4 in 1023rds, live in bits 8 to 19 and 20 to 31 of its lineage word; the strain number keeps the low eight, so every reader of the lineage masks it (`strainOf`). When placing they are the 25th and 26th plain gene numbers (`GENE_IN` is 26). The dish's `cohesion` setting (1 for new dishes, 0 for dishes saved before it) decides whether they are used and mutated; at 0 steering, homing and birth take exactly the path they did before. The census adds two sums for them.
- **Incubator (arena in the code):** each step runs claim and birth, then *report* (each particle adds how much it can digest to its food cell), then the food pass (shares each cell's food among exactly those particles), then live (eat that share, pay for living, maybe divide or die, move) and clear, then a return pass that puts the dead's matter back into the broth, all within the step, so energy is conserved and a saved dish holds everything. A 64-byte gene per particle, whose six emissions and six responses are packed as half floats. Steering adds a crowding penalty to slime sensing, which is Particle Lenia's energy. Six chemicals live in two trail maps, each with its own fade and spread. Food is a mass-balanced field that flows faster along veins. Reaction fields run as Gray-Scott on the food grid, with each cell's recipe read from maps the particles give recipes off into. Food counters and recipe sums share one buffer, so a pass stays within the GPU's eight storage buffers. No rule counts a whole strain: births are limited only by a particle's energy and a free place in the dish. `arena.rules` can switch off the particle rules that hold bodies together (homing, crowding, cooperative digestion) for experiments; all are on by default and none is on screen. Specimens are held in memory, so REPLAY is exact. The dish's shaders are built for each dish size, with its grid sizes and counter places written in. Distances are in pixels of a 1080-high picture at every size.
- **Cells:** two compute passes every 150 steps: one averages the dish's shown glow over 8-pixel squares and notes the strongest chemical in each, the other samples up to 131,072 particles with their strains. The rest runs on the CPU in pieces between frames: enclosures at eight brightness levels, filled in, merged across levels, measured, matched to the cells already followed and scored. It only reads the dish, so it never changes a run.
- **Specimen tests:** `testSpecimens` packs the dish in the Incubator into memory with `packDish` (trails unrounded), runs each specimen in the standard test dish with the dish's own step and census passes (`stepArena`, `submitCensus`) while the Incubator is marked busy, then puts the dish back with `putDish` and hands back the original strain objects, cell tracks, census and zoom, so the dish carries on exactly. The measures are read from the census's body tracking, an 8-pixel grid of particle positions at the end, and the reaction field; nothing in a test reads a gene.
- **Taste learning:** momentum from recent pick direction plus memory of favorites. One plain child and the WILD child are never steered.
- **Family records:** an in-memory graph connects unsaved generations, so a save links to its nearest saved ancestors.
- **Export:** a custom PNG writer, plus WebCodecs H.264 with a custom MP4 muxer.

**Save format (version 7):** `id, parents, generation, name, tags, createdAt, seed, step, quality, init, grownAt, count, species, field, life, view, metrics`, plus these optional fields:

- `walls`, `spawns` and `body`. `body` points to a gzip file in `saves/bodies/`. `spawns` is left out when a body is saved.
- `paint`, a fingerprint of `spawns`.
- `updatedAt`, set when a save is updated.
- `autoName`, set while the name is automatic.
- `formerName`, the name it had before names became strain codes.
- `startShape`, the shape a SHAPE start began from, for reading. Replays take it from the seed.

The organism's colors are stored in `view.palettes` and `view.fieldPalette`. Older versions still load. When changing the format, keep them loading.

## Files

| Path | What it holds |
|---|---|
| `saves/*.json` | Saved organisms, save format version 7 (above) |
| `saves/bodies/*.dlbody` | The grown body of each save: every agent, trail, vein and chemical, gzip |
| `saves/thumbs/*.webp` | Archive pictures, regrown if missing |
| `saves/specimens/` | Specimens: a description (`.json`), a picture (`.webp`) and particles and trail (`.dlspec`, gzip, version 3). A cut keeps its organism's rules and colors; a kept body keeps every gene its particles evolved, as 28 numbers a particle (24 in files from before homing and crowding, which open with both at 1; 26 before hunting, whose particles draw hunting and a kin mark when placed); either can carry the reaction field beneath it. A kept cell also stores `masked` (its trail is already cut to its outline) and `cell` (its name in the dish, the saved dish's name if any, score, parts, age and strains). A tested specimen stores `behavior`: the test's `rules` and `steps`, when it ran, and its measures (`travel`, `grows`, `pieces`, `fill`, `holes`, `hole`, `stretch`, `field`); the card's sentence is made from them when shown, so its wording can change without a new test |
| `saves/dishes/` | Saved dishes: a description (`.json`) with every strain and a list of snapshots, the newest picture (`.webp`), one round snapshot per save (`.s<step>.webp`) and the whole dish (`.dldish`, gzip, version 2): every particle place, the living particles' genes and then their second gene records (version 1 files have none, and open with no one hunting), both trail maps, the broth, the reaction field and its recipe maps, and each strain's body map. Each strain's `track` in the description keeps its bodies, splits, deaths, lifespans, confirmed `divisions` and the splits still `pending` confirmation. The description also keeps the cells the dish was following (`cells`, each outline stored as runs of squares), the rate food grew back at (`regrow`), and its ECOSYSTEM score when saved (`ecosystem`: `score` and its five `parts`); each entry of `history` also holds how clumped the dish was (`clump`, the share of particles in the densest tenth of its 20-pixel squares); a dish saved at another rate, or before that field, opens with its FOOD rescaled so it gets the same food. Dishes saved before the strain cap was removed may carry a `rules` field; it is ignored |
| `saves/removed/` | Saves, specimens and dishes removed or folded in the Archive. Nothing there is deleted |
| `saves/taste.json` | What taste learning has learned from your picks |
| `saves/deck.json` | The specimen deck: the keys of the specimens in it, front first (`format` `digital-life-deck`, version 1). Without it the deck starts empty |
| `images/`, `videos/` | PNG and MP4 exports |

Trails in body, specimen and dish files drop their least visible bits so the files compress well; everything else is
exact, so a saved dish reopens and runs exactly as the original would have from its rounded trails.

### Keeping old files working

Every format change keeps older files opening. The script's "Keeping old files working" section lists where each older
kind of file is handled. Two upgrades change files in place, once, when the saves folder is read: names from before
strain codes are renamed (each keeping its old name as `formerName`), and dishes saved as several entries are folded
into one.

## Testing

`.\tests\run.ps1` runs the whole suite in a fresh, headless Chrome or Edge with a throwaway profile, so it never sees
your saves, and prints PASS or FAIL for each check. It takes about half a minute. `-Only "<check name>"` runs one check.

| Check | What it proves |
|---|---|
| Microscope fingerprints | The five regression cases below grow exactly as they always have |
| Incubator fingerprint | Two seeded organisms, cut and placed in a 1× dish with PATCHES 0, one food and the FOOD an older dish opens with, give the recorded dish every time, so older dishes run unchanged |
| Same body in every dish size | A body keeps its true size in 1×, 1.5× and 2× dishes |
| Saved dish reopens exactly | Saving, running on, then reopening and running as far gives the same dish; REPLAY returns to the save |
| One Archive entry per dish | Saving again keeps one entry with a snapshot per save, and an older separate save folds in |
| Specimens: file and duplicates | A specimen survives its file, and cutting the same body twice files it once |
| Old names renamed once | Old names become strain names, a typed name stays, and a second pass changes nothing |
| Cells: found, kept apart, read only | On a drawn grid the finder finds three closed cells, one inside another, and not an open arc, and sees the bodies inside; looking for cells leaves a real dish's run unchanged |
| Console holds still | With no cells, one or three, and CELLS on or off, the Incubator's sliders and chart stay put; the cell list keeps its order while pointed at |
| Energy only comes from food | With no food growing back, everything a dish holds (broth, stored energy, the particles' matter) falls by at least what living costs |
| Older dishes keep their food | A dish saved when food grew back at another rate (0.006, or 0.012 before rates were recorded) opens with FOOD rescaled to get the same food; a new one keeps its FOOD |
| Ecosystem score | Made-up histories: strains trading ground in a steady dish of separate bodies score high; the same dish as an even mush, a crash, frozen strains and too little history do not; a real dish shows and saves its score |
| Inherited cohesion | Homing and crowding stay exactly 1 in a dish without inherited cohesion and vary once they mutate; a kept body placed again brings its own; a kept specimen file with 24 numbers a particle opens with both at 1 |
| Predators | Placed particles start with the intended spread of hunting; in one step's bites, strains bite each other and hardly bite their own kind; a kept body brings its hunting; a version 1 dish file opens with no one hunting |
| Patches and two foods | In a cleared, empty dish food grows back evenly at PATCHES 0, in patches at 0.8 with about the same total, and later elsewhere; with two foods, diets differ and both foods are eaten |
| Fed slides | A BIOLOGY: FED slide repeats exactly, lives on part of its agent places, and with no regrowth loses more than its cost of living |
| Divisions | On made-up body maps counted every 100 steps, a round body that becomes two lasting round bodies is one division; a thin wall breaking, a speck pinched off, a split that rejoins, a split whose half dies, one too recent to judge, and two bodies that touch and part again are none |
| Specimen test | TEST sets a two-strain dish aside and puts it back with the same particles and living genes, so it runs exactly as if never touched; two tests of one specimen measure the same; made-up results read as the right sentences, and an out-of-date one asks for a new test |
| Every help label has its text | Every control that offers help, in every room and Archive view, has its text |

The test organisms are grown from fixed seeds in the browser's private storage. The fingerprints were recorded on an
NVIDIA RTX 40-series card; another GPU may differ, but the checks that compare two runs still hold. A changed
fingerprint means behavior changed, which is only acceptable when intended: then record the new value in
`tests/suite.js` and say why in the commit. A new Incubator fingerprint also means raising `BEHAVIOR.rules` in the
script, so specimens tested under the old rules ask to be tested again.

The five Microscope regression cases, which can also be run by hand from the browser console through `window.DL`:

| Quality | Seed | Start | Species | Ecology | Hybrid | Expected hash |
|---|---|---|---|---|---|---|
| MED | 12345 | scatter | 1 | none | off | `678BF9A8` |
| LOW | 777 | in | 2 | chase | off | `F6A141F8` |
| HIGH | 9001 | out | 3 | cycle | off | `8E45D7FF` |
| LOW | 5150 | scatter | 2 | rival | coral | `96ADE82B` |
| MED | 6060 | out | 3 | cycle | cells | `573B3DF1` |
