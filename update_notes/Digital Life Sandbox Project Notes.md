# Digital Life Sandbox: Project Notes

## Goal

Make something that looks organic, soft, glowing, and beautiful, and that ends up in structures I wouldn't have imagined before running it. Aesthetics matter as much as the behavior: this should feel like art. Reference look: Sebastian Lague's slime mold simulation (soft and glowing, not hard and crisp).

## Platform Decision

- Start in the browser with WebGPU (WebGL2 as a fallback), plain JavaScript, single self-contained page.
- Runs on the desktop NVIDIA GPU through compute shaders, so scale is not a big worry.
- Unity is a later option if I want 3D, huge particle counts, or something shippable. No official Claude plugin for Unity as far as I know, so there is more friction there. Verify before relying on any community bridge.
- Prototype ideas in the browser, port winners later if needed.

**GPU requirement:** build for my NVIDIA GPU from the start. The agent update and the trail diffusion and decay both run as GPU compute shaders (WebGPU), not on the CPU. Design the data layout (agent buffer, trail texture) around that from day one so scaling up agent counts doesn't need a rewrite.

## Base Simulation: Slime Mold (Physarum)

- Agents move forward, sense trail intensity ahead, left, and right, then steer toward the strongest.
- Agents deposit trail. The trail map diffuses and decays each frame.
- Core parameters: sensor angle, sensor distance, turn speed, move speed, diffusion rate, decay rate.
- Implementation is one agent shader plus one blur-and-fade shader, so it is easy to write and tweak.
- Later extension: multiple species that attract or repel each other's trails.

**Starting design:** the first build is explicitly inspired by Sebastian Lague's slime mold simulation (his Coding Adventure video). Use it as the reference for the agent rules, the trail map approach, and the soft, glowing look. Diverge from it later through the evolutionary exploration below.

## Starting Rules and Conditions

The first build uses the classic slime mold rules that Sebastian Lague's simulation is based on. Two layers: the agents and the trail map.

**Agent rules (every frame, for every agent)**

- Each agent has a position and a heading angle.
- Sense: read the trail map at three points, straight ahead, ahead-left, and ahead-right, each a set distance away.
- Steer: compare the three readings and turn toward the strongest, left, right, or straight, with a little randomness mixed in.
- Move: step forward at a fixed speed.
- Deposit: drop a bit of trail at the new position.

**Trail map rules (every frame, for every pixel)**

- Diffuse: blur each pixel with its neighbors so the trail spreads out.
- Decay: multiply by a number slightly below one so the trail fades.

**Core parameters**

- Sensor angle, sensor distance, turn speed, move speed, deposit amount, diffusion strength, and decay rate.
- Sensor distance and move speed should be expressed relative to canvas size (see Compute Budget).

**Parameter sliders**

- Every core parameter is exposed as a slider in the interface, so I can adjust it live and watch the structure respond.
- This is planned for the first build, not deferred. The sliders also feed the save states, so every saved state records its exact slider values.
- Styled as knobs or sliders in the Interface Theme.

**Initial conditions**

- Default: agents scattered randomly, each facing a random direction.
- Variants to keep as a cheap variable: agents starting in a circle facing inward or outward, which gives very different structures.
- Start simple: one species, one trail channel, and a plain bounded canvas. Extra species, evolving rules, and hybrid systems layer on afterward without changing this core.

## Compute Budget

Hardware: desktop with an NVIDIA RTX 4070 (12 GB of memory). All figures below are rough starting estimates to be confirmed by actually running the sim, not measured results.

**Where the cost comes from**

- Agent count: each agent does a few trail reads and one trail write per frame. Cheap per agent.
- Trail map resolution: the blur and decay touch every pixel every frame, so this becomes the heavier cost at high resolution.

**Starting conditions**

- Default: around 500,000 agents on a 1080p trail map.
- Rough ceiling at 1080p: one to two million agents while holding a smooth frame rate.
- At 1440p: several hundred thousand to about a million agents.
- 4K is doable, but the trail blur starts to dominate the cost.
- Leave headroom for later features: multiple species, metrics calculations, and video recording all take GPU time.

**Quality ladder**

- Low, medium, and high presets that set agent count and trail map resolution together.
- Explore and run batches at low settings, then re-run a keeper at high settings.
- Patterns mostly keep their character when scaled, so low-res exploration is a fair preview.

**Keeping the machine from getting stressed**

- Decouple simulation speed from display rate: fast-forward runs extra simulation steps per displayed frame.
- Auto-throttle: back off the step count or agent count if frame time climbs past a target.
- Deterministic runs with a stored seed, so a promising low-res variant can be replayed larger.
- Store replay snapshots at reduced resolution or lower frequency, since snapshot storage is more likely to be the limit than the simulation itself.

**Scaling caveat**

- Parameters like sensor distance and move speed are measured in pixels, so a pattern will not scale perfectly when resolution changes. Express them relative to canvas size.
- Open question: how much a pattern drifts between low and high settings, to check once there is a working build.

## Aesthetic Toolkit

- Continuous simulations (slime mold, Lenia, reaction-diffusion) rather than hard-edged cells.
- Slowly fading trails so motion leaves a soft wake.
- Bloom pass so bright areas bleed into their surroundings.
- Map simulation values (density, speed, species) through luminous color gradients instead of flat colors.
- Optional film grain and subtle post-processing.

## Paths to Novel, Emergent Behavior

Change the structure of the rules, not just the numbers.

- Agent internal state: energy, memory, reproduction, behavior switching.
- Evolving rules: each agent carries its own sensor angle and turn speed, which mutate and get selected.
- Layered environments: terrain, obstacles, shifting resource fields.
- Asymmetric multi-species relationships, such as predators following prey trails.
- Hybrid rule mixing: slime agents interacting with a reaction-diffusion field, or a Lenia layer feeding trails to particles.
- Caveat: can't promise something is truly never done. The community is large and scattered. Combinations of evolving parameters plus environmental pressure are the most likely place for surprises.

## Core Workflow: Evolutionary Exploration

The strategy is exploration, not design. Build a flexible system, then search the space.

1. The sim shows a batch of variants.
2. I pick the ones that feel alive and organic.
3. The system mutates the picks to produce the next batch.
4. Repeat. Over a few rounds it drifts into territory I would not have aimed for.

## Tooling Priorities

The tooling should be simple, clear, and fun to use. Grow the project through save states over time.

- Save any interesting state together with its exact settings so I can always return to it.
- Reroll randomness without losing a good configuration.
- Record the best moments as video.
- Keep a growing library of saved states that acts as the evolutionary lineage.
- Quick, low-friction picking interface: look at a batch, click the ones I like.

## Interface Theme

The software interface should feel like a piece of tactile hardware, inspired by the design of Teenage Engineering's EP-133, but with a blue and green palette instead of their signature orange. Blues and greens feel closer to life and water, which suits the project.

**Borrowed from the EP-133**

- Warm, light-gray chassis as the neutral base of the whole interface.
- Chunky, rounded, pad-style buttons laid out in a tight grid.
- Small, monospace-style labels in a clean, utilitarian type style.
- A dot-matrix or segmented-style display for readouts such as the simulation metrics.
- Color used sparingly as accent, not flooded across everything.

**Palette direction**

- Neutral: light warm gray for the body, darker gray for text and outlines.
- Accent family: teal, seafoam, and deep blue.
- One brighter accent reserved for active or selected states.
- The simulation canvas is the luminous centerpiece, framed by a calm interface so the glow stands out.

**Interface ideas**

- Pad-like buttons for the core actions: save, mutate, reroll, and replay.
- Knob-style controls for parameters when I'm ready to add them.
- A small segmented display showing live metrics for the current run.
- Batch view for the pick-and-breed loop styled as a grid of pads, each showing a variant thumbnail.
- Keep it simple, clear, and fun to use, matching the tooling priorities above.

## Quality-of-Life Features

Extra features to make the app friendlier, more fun, and easier to use.

**Undo and history**

- Rewind the last several parameter changes, so if a slider tweak sends the structure somewhere magical, I can get back to where it was a few seconds ago.

**Image and video export**

- One-click export of a clean still image.
- One-click export of a short looping clip for sharing.
- Complements the full-run video recording in the tooling priorities.

**Naming and tagging saves**

- Give any saved state a name, like "coral lace", and add tags.
- Makes the library searchable by words, alongside the numeric metrics.

**Randomize with parameter locks**

- A randomize button that shuffles parameters.
- A lock icon on each parameter to freeze the ones I like while the rest shuffle.

**Lineage view**

- A family-tree view showing which saved state was mutated from which.
- Makes the evolutionary history of the library visible and easy to navigate.

**Fullscreen mode**

- Hide all controls and show only the simulation, since the visuals are the point.

**Keyboard shortcuts**

- Shortcuts for the main actions: save, mutate, reroll, replay, play and pause, speed changes, and fullscreen.

**First-run preset gallery**

- On first open, show a gallery of beautiful presets, so the app starts with something striking instead of a blank canvas.

## Application Format and File Storage

**Format decision**

- Start as a single HTML file: double-click to open in the browser, runs on the GPU through WebGPU. Needs a recent Chrome or Edge.
- Claude can write the whole thing in one pass, and it is easy to edit, copy, and share with no installation.
- Upgrade path: once saving and recording needs outgrow the browser, wrap the same web code as a desktop app with something like Electron or Tauri. This is a wrapper, not a rewrite.

**Where saves, images, and videos live**

- Main route: the File System Access feature in Chrome and Edge. The page asks me once to pick a working folder, such as the one next to the HTML file, then reads and writes files there directly.
- Save states, exported images, and recorded videos all land as normal files in that working folder.
- The browser typically asks me to re-grant folder access each session, a single click. A desktop wrapper would remove that step.
- Fallback 1: browser storage. Convenient, but saves are hidden inside the browser and are lost if browser data is cleared.
- Fallback 2: normal downloads into the Downloads folder, moved by hand.
- Videos are recorded in the page and written straight into the working folder.

**Suggested folder layout**

- One working folder holding the HTML file, with subfolders for saves, images, and videos, so the library stays organized and easy to back up.
- Each save state is a small file holding its settings, seed, metrics, name and tags, and parent save for the lineage view.
- Open question: exact file format and naming, to settle when building.

## Playback and Replay

After a run finishes, I want to watch it back from start to finish and control how fast the structures form.

- Replay any completed run from the first frame to the last.
- Adjustable playback speed: slow motion, normal, and fast-forward, switchable on the fly.
- Play, pause, and scrub through the run so I can jump to the moment a structure emerges.
- Replay works on any saved state, not just the latest run, so the library doubles as an archive of how each structure grew.
- Open design question: store periodic snapshots of the simulation state, or store the seed and settings and re-simulate deterministically. Snapshots are simpler and scrub instantly. Deterministic re-simulation uses far less storage but needs the GPU sim to be reproducible.

## Learning From My Picks

Idea: detect patterns in what I select and bias future mutations toward them.

- Log every pick and every pass, with full parameter sets.
- Weight mutation toward parameter regions that my selections cluster in.
- Start simple: per-parameter preference weights, shifting mutation ranges toward picked values.
- Later options: a model that predicts which variants I would pick, and shows me the most promising ones first.
- Keep some pure randomness in the mix so exploration doesn't collapse into one look.
- Optional automated filter that scores visual complexity, to weed out dead blobs and pure noise before I review.

## Carrying Structures Between Generations

**The problem (observed in the first build).** Mutation currently toggles parameters only, so each new generation starts from scratch. When I pick a variant that shows complexity and self-organization, the structure it developed is not recognized or preserved, and new generations cannot interact with it. Goal: add more lifelike growth, inheritance, and interaction, informed by real research on living systems.

**Priority idea: inherit the body, not just the recipe**

- When I pick a variant, save its full state: the trail map, every agent's position and heading, and the parameters.
- The next generation starts from that saved state and mutates only the parameters, so the structure I liked has to survive its own changing rules.
- Optionally mutate only a fraction of the agents, so old and new behavior share one world.

**Per-agent parameters (from Flow-Lenia)**

- Give each agent its own copy of the core parameters, inherited from where it was born, with small mutations.
- This lets an old organism and a mutated one coexist and interact in the same world, instead of one global rule set replacing the other.
- Inspiration: Flow-Lenia (Plantec et al., 2022), which makes update-rule parameters dynamic and localized within the simulation so multiple species with different rules can mix and interact.
- Related idea from the same paper: conserving total mass acts as an evolutionary pressure and keeps creatures spatially localized.

**Use-it-or-lose-it reinforcement (from real Physarum research)**

- In the Tero, Kobayashi, Nakagaki model, tube conductivity grows with the flux a tube carries and decays otherwise. Empirical rules from the lab: tubes not connected to a food source tend to disappear, and when several tubes link the same two food sources, the longer ones tend to disappear.
- In the Tokyo rail experiment, the plasmodium first filled much of the available space, then thinned out to a subset of larger interconnecting tubes.
- Applied here: let heavily traveled trail paths reinforce and persist, and let unused ones fade faster, so a skeleton forms and lasts. Grow first, then let use decide what survives.
- Optional: add food sources or obstacles so networks have something to connect.

**Other lifelike mechanisms to explore**

- Agent energy: eating from food, spending energy to move, reproducing or dying.
- Species interaction: one organism's trail acts as food, poison, or territory marker for another, giving symbiosis, predation, or territory.

**Recognizing structures worth keeping**

- Use the planned metrics (fractal dimension, connectivity, interestingness score) to detect a structure worth preserving.
- Elitism: copy the best structures unchanged into the next generation and mutate only the rest.
- Log which structures I pick, so recognition can learn from my taste over time.

**Suggested order of build**

1. Full-state carry-over on pick (trail map, agents, parameters).
2. Per-agent inherited parameters with mutation.
3. Use-it-or-lose-it reinforcement of trails.
4. Food and energy.
5. Species interaction and metric-based recognition.

**Research leads (read in full before relying on them)**

- [Rules for Biologically Inspired Adaptive Network Design](https://www.science.org/doi/10.1126/science.1177894) (Tero et al., Science, 2010).
- [A mathematical model for adaptive transport network in path finding by true slime mold](https://pubmed.ncbi.nlm.nih.gov/17069858/) (Tero, Kobayashi, Nakagaki, 2007).
- [Minimum-Risk Path Finding by an Adaptive Amoebal Network](https://link.aps.org/doi/10.1103/PhysRevLett.99.068104) (Nakagaki et al., 2007).
- [Flow-Lenia: Towards open-ended evolution in cellular automata through mass conservation and parameter localization](https://arxiv.org/abs/2212.07906).
- Caveat: these papers use different models than this simulation, so they inspire mechanisms rather than provide recipes. Only search summaries have been read so far.

## Complexity Parameters to Add

**Direction note.** The slime mold is the starting base, not the destination. The real goal is digital life in general, so ideas should be drawn from the wider artificial life field (Lenia and Flow-Lenia, particle life, evolving-creature simulations, open-ended evolution research), not only slime mold biology. The two parameters below are the first picks; both came from slime mold related work, so the next round of ideas should look further afield.

**1. Per-agent sensor variation**

- Instead of one global sensor angle and sensor distance, give each agent its own values, spread around the global setting by a variation slider.
- Published slime mold agent work found that varying these across agents produces richer patterns, such as networks, honeycomb-like cells, and shrinking rings.
- Fits naturally with the per-agent inherited parameters already planned, so the variation can also be inherited and mutated.
- Suggested controls: a variation amount slider for each of the two parameters, and a seed so the spread is reproducible.

**2. Density limit**

- Agents slow down or turn away when too many agents are packed into the same neighborhood.
- Prevents everything from collapsing into solid blobs and encourages spreading, branching, and filling space.
- Suggested controls: a crowding threshold, a slowdown strength, and an option to turn away instead of slowing.
- Can reuse a coarse grid of agent counts, which the entropy and clustering metrics already need.

**Considered and skipped for now**

- A repellent second trail channel: already available in the current build.

**Parked ideas for later**

- Agent memory, where an agent partly keeps its previous heading, giving momentum and smoother curves.
- Sensing noise, since a little imperfection can help escape dead patterns.
- Agent age, where deposits strengthen or weaken over time.
- Slow environmental drift, such as a diffusion rate that oscillates, like seasons.
- Food gradients or nutrient fields, and a conserved total of trail or energy that structures compete for.

## Beyond Slime Mold: Evolvable Brains and Energy

The goal is digital life in general, so this section draws on the wider artificial life field and not only slime mold biology.

**Ideas from the wider field (from general knowledge, not yet researched)**

- Particle life style interactions: an asymmetric attraction matrix between agent types, where A chases B but B flees A, producing pursuit, orbiting, and cell-like clusters.
- Lenia style growth: a smooth growth function with a narrow sweet spot yields creatures that hold their shape and move.
- Evolving creature systems in the style of Polyworld and Tierra: agents carry a small genome that controls behavior, with energy costs, so selection happens inside the world and not only through my picks.
- Neural cellular automata style: each agent has a tiny learned or evolved brain, so its steering rule is a mutable function instead of fixed sensing logic.

**Top pick: a small evolvable brain plus an energy budget per agent**

- Brain: a tiny neural network that takes the sensor readings (and optionally energy or crowding) as inputs and outputs a turn and a speed. Its weights are inherited and mutated, replacing or extending the fixed steering rule.
- Energy: each agent has an energy value. Moving and sensing cost energy, finding trail or food gives energy, and agents reproduce above a threshold and die at zero.
- Together they move the project from pattern formation toward real selection and adaptation, which fits the digital life goal.

**Compute cost (rough estimates, confirm by benchmarking on the RTX 4070)**

- Energy is nearly free: one extra number per agent and a subtraction per frame.
- A tiny brain, for example 3 to 5 inputs, one hidden layer of 8 to 16 units, and 2 outputs, costs a few hundred multiply-adds per agent per frame. GPUs handle this well, and the memory-bound trail reads probably still dominate.
- The bigger constraint is memory and scale: each agent stores its own weights, a few hundred numbers, so 500,000 agents means hundreds of millions of values. This fits in 12 GB but affects speed and the size of saved states.
- Expected tradeoff: roughly 100,000 to 200,000 brainy agents in place of 500,000 simple ones. This is a guess. Fewer, smarter agents may look just as rich.
- Ways to keep it cheap: agents share a small set of brain templates instead of each having unique weights, or the brain is optional so exploration runs use simple agents and keepers run with brains.
- Saved full states will grow with per-agent weights, so plan the file format and storage for that.

**Before implementing**

- Consult published research first, for example on neural cellular automata, Lenia and Flow-Lenia, Polyworld and Tierra, particle life, and open-ended evolution, so the design builds on what has been tried and what failed.

## Simulation Metrics

Compute a handful of numbers from every run and store them with its save state. They give each saved pattern a numerical fingerprint, so I can sort, search, and cluster the library, and so the learning-from-picks layer has something concrete to find patterns in.

**Information and disorder**

- Shannon entropy of the trail map's intensity histogram: low means dead or clumped, high means noise, and the interesting patterns tend to sit in between.
- Spatial entropy of the agent distribution, measured on a coarse grid over the canvas.

**Spatial structure**

- Fractal dimension of the trail network (box counting): separates branching, vein-like webs from solid blobs.
- Connectivity of the network: number of connected components, and number of loops.
- Trail coverage: the fraction of the canvas that holds meaningful trail.

**Dynamics**

- Rate of change: how much the trail map differs from frame to frame.
- Behavior class: whether the run settles into stillness, oscillates, or keeps evolving.
- Time to structure: how long before a stable pattern first appears.

**Agent behavior**

- Clustering: how tightly agents bunch together.
- Local alignment: how much neighboring agents move in the same direction.

**Composite interestingness score**

- One combined number that rewards structure near the edge between order and chaos.
- Doubles as the automatic filter for dead blobs and pure noise before I review a batch.
- Weights can start hand-tuned, then be adjusted using which runs I actually pick.

**Implementation notes**

- Compute metrics on the GPU where possible (histograms and reductions suit compute shaders), and sample over time rather than only at the final frame.
- Store the metric values, the sampling schedule, and a version number for each metric alongside the settings, so older saves stay comparable if a formula changes.

## Known Pitfalls

- Most random settings produce either noise or a dead blob, so a good filter matters.
- In the browser, recording, UI, and presets must be built by hand.

## Next Steps (when I have time and resources)

- Build a minimal WebGPU slime mold with save, reroll, and mutate hooks from day one.
- Add the pick-and-breed batch view.
- Then layer in extra species and hybrid rules.
- Parameter sliders can come later, not needed yet.
