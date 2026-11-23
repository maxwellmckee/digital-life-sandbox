# Digital Life Sandbox

A glowing, evolving slime-mold simulation that runs on the GPU in one self-contained web page. You watch digital organisms form networks, pick the ones you love, and breed them into structures nobody designed.

The goal is **art through emergence**: organic, soft, luminous forms that are discovered rather than drawn. Slime mold is the starting point. The longer-term goal is digital life in general.

<table>
  <tr>
    <td><img src="docs/screenshots/glowing-cells.webp" alt="Glowing white cells joined by a blue and orange network" width="100%"></td>
    <td><img src="docs/screenshots/green-honeycomb.webp" alt="Green honeycomb network with a bright pink outline" width="100%"></td>
    <td><img src="docs/screenshots/violet-ribbons.webp" alt="Violet ribbons drifting between pale green branching colonies" width="100%"></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/contained-colony.webp" alt="Blue network contained inside a bright circular membrane" width="100%"></td>
    <td><img src="docs/screenshots/bright-river.webp" alt="Bright blue river winding through a teal cellular network" width="100%"></td>
    <td><img src="docs/screenshots/crescent.webp" alt="Violet crescent wrapped around a pale branching structure" width="100%"></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/reaction-maze.webp" alt="Dense teal maze formed by a reaction-diffusion hybrid" width="100%"></td>
    <td><img src="docs/screenshots/branching-veins.webp" alt="Thick white veins branching through small violet loops" width="100%"></td>
    <td><img src="docs/screenshots/cell-field.webp" alt="Regular field of violet cells inside a bright teal border" width="100%"></td>
  </tr>
</table>

<p align="center"><em>Organisms grown and bred in the sandbox.</em></p>

> **New here, or a new Claude session?** Read this file first, then skim [Build Update 2](Digital%20Life%20Sandbox%20Build%20Update%202.md) and the [Project Notes](Digital%20Life%20Sandbox%20Project%20Notes.md). This README says what exists today. Those two documents hold the vision and the plan.

## Run it

1. Double-click `digital_life.html`. It needs a recent **Chrome or Edge** with WebGPU.
2. To save, click **SET FOLDER** and choose this project folder. The browser may ask you to allow access again in a later session.

There is nothing to install and no build step. The project was built for a desktop NVIDIA RTX 4070.

## Project files

| Path | What it is |
|---|---|
| `digital_life.html` | The entire app: interface, GPU shaders and logic |
| `README.md` | This guide |
| `Digital Life Sandbox Project Notes.md` | The original vision and design document |
| `Digital Life Sandbox Build Update 2.md` | The next planned changes. It overrides the Project Notes where they conflict |
| `saves/` | Saved organisms (`dl-*.json`) and `taste.json` |
| `saves/thumbs/` | Library pictures. They can be regrown if missing |
| `saves/removed/` | Saves removed in the Library. Nothing is permanently deleted there |
| `images/`, `videos/` | PNG and MP4 exports |
| `docs/screenshots/` | Pictures used in this README |

`saves/`, `images/` and `videos/` are personal working folders. They stay on your computer and are not uploaded to GitHub. The app creates what it needs when you choose a folder.

## How to use it

### The two views

- **SOLO** shows one organism large. Adjust its sliders live and draw on it.
- **BATCH** shows nine variants. Click the ones you like, press **BREED**, and repeat. Double-click a tile to open it in Solo from where it currently is.

Each Batch generation holds your kept picks, guided children, one plain child and one **WILD** child. With **FILTER** on, dead variants are replaced before you see them.

### Pads and shortcuts

| Control | Key | What it does |
|---|---|---|
| MUTATE / BREED | `M` / `Enter` | Solo nudges the settings. Batch breeds from your picks |
| RANDOM | `N` | Rolls unrelated new organisms. Batch keeps picked tiles |
| REROLL | `R` | Same settings, new starting positions |
| REPLAY | `P` | Same settings and same start, regrown from step 0 |
| SAVE | `S` | Saves the organism, or every picked tile |
| PAUSE | `Space` | Freezes or resumes |
| UNDO | `U`, `Ctrl+Z` | Reverses the last change, brush stroke or generation |
| LIBRARY | `L` | Browse saves as a grid or family tree |
| FULL | `F` | Fullscreen |
| View | `B` | Switches Solo and Batch |
| Help | `H` | Hover over anything for an explanation |
| Draw page | `D` | Opens the brushes |
| Export | `I`, `C`, `V` | PNG image, seamless 6-second loop, 1080p recording |
| Speed | `[`, `]` | 1x to 8x |
| Tiles | `1`-`9`, `Shift`+`1`-`9` | Pick a tile, or open it |

### Control pages

- **ORGANISM:** species count, ecology and movement sliders.
- **FIELD:** an optional reaction-diffusion chemical that agents interact with.
- **LIGHT:** color gradients, glow and exposure. These change the look only.
- **DRAW:** barrier and organism brushes, in Solo.
- **TASTE:** what the app has learned from your picks.

### Drawing

- **BARRIER** paints thick walls organisms cannot enter. **ERASE** removes them. The current run continues while you draw, then **GROW** starts a new run inside the drawing.
- MUTATE, RANDOM, REROLL and REPLAY also pick up a new drawing.
- Children you breed inherit their parent's barriers. RANDOM keeps the current barriers too. Use **CLEAR**, then **GROW**, to remove them.
- **ORGANISM** gathers the chosen species wherever you hold the mouse. It moves existing agents to the brush, so the total population stays constant and performance is unaffected.
- Painted organisms are recorded by simulation step, so REPLAY and saves re-enact them. REROLL, MUTATE, RANDOM and breeding start without them.

### Saves and breeding

A save stores the **recipe and seed**, not a frozen image, and regrows the organism when opened. Breeding never changes a save file. Children are new organisms until you save them. The Library's **TREE** view shows which save came from which.

## How it works

**Simulation.** Each agent senses trail ahead, left and right, steers, moves and deposits. The trail map then blurs and fades. All of this runs in WebGPU compute shaders.

| Quality | Trail map | Agents |
|---|---|---|
| LOW and Batch tiles | 960x540 | 125,000 |
| MED | 1920x1080 | 500,000 |
| HIGH | 2560x1440 | 900,000 |

**Key systems in `digital_life.html`:**

- **Species:** up to 3, stored as index ranges in one agent buffer, with a follow/avoid matrix (RIVAL, ALLY, CHASE, CYCLE).
- **Reaction field:** Gray-Scott on a fixed 480x270 grid (CORAL, MAZE, CELLS, WAVES).
- **Barriers:** strokes rasterized to a fixed 960x540 mask. Agents bounce off, and trail and chemical cannot enter.
- **Organism brush:** timed events stored in the genome and applied between simulation steps.
- **Rendering:** per-species gradient lookup, bloom, ACES tone mapping and fine grain.
- **Metrics:** a GPU probe produces the LIFE score and verdicts ALIVE, NOISE, BLOB, FLAT or EMPTY. New variants get four checkpoints because good organisms can start slowly.
- **Taste learning:** momentum from recent pick direction plus memory of favorites. One plain child and the WILD child are never steered.
- **Family records:** an in-memory graph connects unsaved generations, so a save links to its nearest saved ancestors.
- **Export:** a custom PNG writer, plus WebCodecs H.264 with a custom MP4 muxer.

**Save format (version 6):** `id, parents, generation, name, tags, createdAt, seed, step, quality, init, grownAt, count, species, field, view, metrics`, plus optional `walls` and `spawns`. Older versions still load. When changing the format, keep them loading.

## Rules for future changes

1. **Protect determinism.** A seed and settings must reproduce a run exactly. Deposits use atomic fixed-point math and each agent has its own random stream. New features must have no effect when unused.
2. **Never test against real saves.** Use copies or browser-private storage (OPFS). Do not modify `saves/`, `images/` or `videos/`.
3. **Keep it one self-contained HTML file** unless there is a deliberate decision to change that.
4. **Keep the interface simple.** It follows a tactile, EP-133-inspired hardware style with a calm blue-green palette. Too many options is a known concern, so explain new controls in the Help system.
5. **Change one thing at a time** and test it on the GPU.

### Regression check

Open the page through `http://localhost`, then run the five cases below from the browser console. Set each case with the interface controls, assign `DL.st.seed` and `DL.st.init`, then call `DL.restart()`, `await DL.advance(400)` and `await DL.hash()`.

| Quality | Seed | Start | Species | Ecology | Hybrid | Expected hash |
|---|---|---|---|---|---|---|
| MED | 12345 | scatter | 1 | none | off | `678BF9A8` |
| LOW | 777 | in | 2 | chase | off | `F6A141F8` |
| HIGH | 9001 | out | 3 | cycle | off | `8E45D7FF` |
| LOW | 5150 | scatter | 2 | rival | coral | `96ADE82B` |
| MED | 6060 | out | 3 | cycle | cells | `573B3DF1` |

A changed hash means the simulation's behavior changed. That is only acceptable when the change is intended. `window.DL` is the debug handle for this kind of testing.

## Known limitations

- Reopening a save regrows at most 3,000 steps, so a very long run will not return to its exact late structure.
- Slider changes made during a run are not recorded. A save regrows with its final settings from step 0.
- Children inherit the recipe, not the grown structure. **This is the top item on the roadmap.**
- There is no WebGL2 fallback.
- A hidden browser tab or preview pane throttles animation, so frame-rate measurements there are not meaningful.

## Status and roadmap

**Built:** WebGPU simulation, Solo and Batch, breeding, 3 species, ecologies, reaction-diffusion hybrids, 12 color gradients, metrics and dead-variant filter, Help mode, taste learning, PNG and MP4 export, visual Library, family tree, RANDOM, barrier brush and organism brush.

**Next, in the order from Build Update 2:**

1. Children inherit the grown structure, not only the recipe.
2. "Save this moment" full-state saves.
3. Per-agent inherited parameters.
4. Merge two saved structures into one world.
5. Energy, food and species interaction.
6. Endosymbiosis-inspired dependence.

**Other ideas from the Project Notes:** first-run preset gallery, parameter locks for RANDOM, a replay timeline with scrubbing, a density limit, per-agent sensor variation, and small evolvable brains.
