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
- **Incubator (arena in the code):** each step runs claim and birth, then *report* (each particle adds how much it can digest to its food cell), then the food pass (shares each cell's food among exactly those particles), then live (eat that share, pay for living, maybe divide or die, move) and clear, then a return pass that puts the dead's matter back into the broth, all within the step, so energy is conserved and a saved dish holds everything. A 64-byte gene per particle, whose six emissions and six responses are packed as half floats. Steering adds a crowding penalty to slime sensing, which is Particle Lenia's energy. Six chemicals live in two trail maps, each with its own fade and spread. Food is a mass-balanced field that flows faster along veins. Reaction fields run as Gray-Scott on the food grid, with each cell's recipe read from maps the particles give recipes off into. Food counters and recipe sums share one buffer, so a pass stays within the GPU's eight storage buffers. No rule counts a whole strain: births are limited only by a particle's energy and a free place in the dish. `arena.rules` can switch off the particle rules that hold bodies together (homing, crowding, cooperative digestion) for experiments; all are on by default and none is on screen. Specimens are held in memory, so REPLAY is exact. The dish's shaders are built for each dish size, with its grid sizes and counter places written in. Distances are in pixels of a 1080-high picture at every size.
- **Cells:** two compute passes every 150 steps: one averages the dish's shown glow over 8-pixel squares and notes the strongest chemical in each, the other samples up to 131,072 particles with their strains. The rest runs on the CPU in pieces between frames: enclosures at eight brightness levels, filled in, merged across levels, measured, matched to the cells already followed and scored. It only reads the dish, so it never changes a run.
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
| `saves/specimens/` | Specimens: a description (`.json`), a picture (`.webp`) and particles and trail (`.dlspec`, gzip, version 3). A cut keeps its organism's rules and colors; a kept body keeps every gene its particles evolved; either can carry the reaction field beneath it. A kept cell also stores `masked` (its trail is already cut to its outline) and `cell` (its name in the dish, the saved dish's name if any, score, parts, age and strains) |
| `saves/dishes/` | Saved dishes: a description (`.json`) with every strain and a list of snapshots, the newest picture (`.webp`), one round snapshot per save (`.s<step>.webp`) and the whole dish (`.dldish`, gzip, version 1): every particle place, the living particles' genes, both trail maps, the broth, the reaction field and its recipe maps, and each strain's body map. The description also keeps the cells the dish was following (`cells`, each outline stored as runs of squares), the rate food grew back at (`regrow`), and its ECOSYSTEM score when saved (`ecosystem`: `score` and its four `parts`); a dish saved before that field opens with its FOOD rescaled so it gets the same food. Dishes saved before the strain cap was removed may carry a `rules` field; it is ignored |
| `saves/removed/` | Saves, specimens and dishes removed or folded in the Archive. Nothing there is deleted |
| `saves/taste.json` | What taste learning has learned from your picks |
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
| Incubator fingerprint | Two seeded organisms, cut and placed in a 1× dish, give the recorded dish every time |
| Same body in every dish size | A body keeps its true size in 1×, 1.5× and 2× dishes |
| Saved dish reopens exactly | Saving, running on, then reopening and running as far gives the same dish; REPLAY returns to the save |
| One Archive entry per dish | Saving again keeps one entry with a snapshot per save, and an older separate save folds in |
| Specimens: file and duplicates | A specimen survives its file, and cutting the same body twice files it once |
| Old names renamed once | Old names become strain names, a typed name stays, and a second pass changes nothing |
| Cells: found, kept apart, read only | On a drawn grid the finder finds three closed cells, one inside another, and not an open arc, and sees the bodies inside; looking for cells leaves a real dish's run unchanged |
| Console holds still | With no cells, one or three, and CELLS on or off, the Incubator's sliders and chart stay put; the cell list keeps its order while pointed at |
| Energy only comes from food | With no food growing back, everything a dish holds (broth, stored energy, the particles' matter) falls by at least what living costs |
| Older dishes keep their food | A dish saved when food grew back twice as fast opens with FOOD doubled; a new one keeps its FOOD |
| Ecosystem score | Made-up histories: strains trading ground in a steady dish score high, a crash, frozen strains and too little history do not; a real dish shows and saves its score |
| Every help label has its text | Every control that offers help, in every room and Archive view, has its text |

The test organisms are grown from fixed seeds in the browser's private storage. The fingerprints were recorded on an
NVIDIA RTX 40-series card; another GPU may differ, but the checks that compare two runs still hold. A changed
fingerprint means behavior changed, which is only acceptable when intended: then record the new value in
`tests/suite.js` and say why in the commit.

The five Microscope regression cases, which can also be run by hand from the browser console through `window.DL`:

| Quality | Seed | Start | Species | Ecology | Hybrid | Expected hash |
|---|---|---|---|---|---|---|
| MED | 12345 | scatter | 1 | none | off | `678BF9A8` |
| LOW | 777 | in | 2 | chase | off | `F6A141F8` |
| HIGH | 9001 | out | 3 | cycle | off | `8E45D7FF` |
| LOW | 5150 | scatter | 2 | rival | coral | `96ADE82B` |
| MED | 6060 | out | 3 | cycle | cells | `573B3DF1` |
