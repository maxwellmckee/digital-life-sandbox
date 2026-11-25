# Research Behind the LIFE Systems

This explains which published ideas shaped the sandbox's early-life features, what was changed to fit them into a GPU agent simulation, and what has been measured. These sources **inspire mechanisms**. The sandbox does not reproduce their models or claim to simulate real biology.

## The central idea

Breeding originally copied only settings, so every child regrew from nothing. Living things also inherit **organized matter**: a cell receives its parent's membrane, cytoplasm and internal structure, along with its genes. The sandbox now does the same. A child wakes up inside its parent's grown body with changed rules, and that body has to adapt or dissolve.

## How each idea is used

| Idea | Source | In the sandbox | Main difference from the source |
|---|---|---|---|
| Inherited structure | Beisson & Sonneborn, 1965 | **PASS ON: BODY + RULES** copies every agent, trail, vein and chemical into the child | Theirs is a change in a cell's cortex passed to descendants. Ours is a full copy of a simulated world |
| Use-it-or-lose-it tubes | Tero, Kobayashi & Nakagaki, 2007 and Tero et al., 2010 | **VEINS** strengthen where trail is busy and fade where it is not | Local trail level stands in for true fluid flux, with no pressure network |
| Parameters that travel with matter | Plantec et al., 2022 (Flow-Lenia) | **CELLS** each carry their own inherited copy of the movement rules | Stored per agent rather than per grid cell |
| Growth sweet spot | Lenia growth function, as given in Flow-Lenia | Cells gain energy at a preferred density and lose it when too sparse or crowded | Applied to the trail an agent stands on |
| Metabolism, boundary, heredity | Gánti's chemoton | Used as a checklist for what "early life" needs | Metabolism and heredity are modeled. A true self-made membrane is **not** built yet |
| Heredity before genes | Vasas et al., 2012 | Motivates treating a self-maintaining structure as something selection can act on | No chemical reaction network is modeled |
| Agent-based Physarum | Jones, 2010 | The base simulation's family of models | The sandbox extends it with species, fields and energy |

## The rules as implemented

**Veins.** The Physarum adaptation rule is `dD/dt = f(|Q|) - μD`, where `D` is tube conductivity, `Q` is flux and `f` is an increasing function. The sandbox uses `f(q) = q² / (1 + q²)` with `μ = 1` and a slow time step. This specific `f` is a design choice. A thick vein holds trail longer and attracts more agents.

**Energy.** Each step, a cell's energy changes by `metabolism × (G(x) - moveCost × speed)`, with `G(x) = 2·exp(-(x - μ)² / 2σ²) - 1`. This is the Lenia growth curve. `x` is the log of the trail the cell can eat, and each cell's preferred `μ` is inherited.

**Food web.** The FOLLOW matrix doubles as diet: a trail a species follows feeds it, and a trail it flees harms it.

**Division.** A cell with enough energy claims an empty place in its species' pool, splits its energy with the daughter, and passes on slightly mutated rules. Claims are resolved with an atomic maximum, so runs stay exactly repeatable on the same hardware and browser.

**Death.** Cells die when energy runs out and also wear out at random. Without this turnover, a well-fed population never opens room for new offspring, and evolution stops.

## What was measured

All tests ran on the project's RTX 4070 at LOW quality with randomly generated organisms. "Structural match" is the correlation between a parent's trail map and its child's, at 120×68 resolution. Even unrelated runs score about 0.3, partly because all runs share a dark border.

| Child's start, 600 steps after birth | Match with parent | Test size |
|---|---|---|
| Rules only | 0.29 | 8 organisms |
| Inherited body | 0.54 | 8 organisms |
| Inherited body, veins off | 0.45 | 6 organisms |
| Inherited body, vein memory 0.60 | 0.54 | 6 organisms |
| Inherited body, vein memory 1.00 | 0.63 | 6 organisms |

Living cells were then run for 3,000 steps on 8 random organisms:

- None went extinct, and all 8 finished with a living structure.
- Population settled anywhere from 18% to 100% of capacity.
- Offspring developed real inherited variation.
- The average speed gene fell slightly below its starting value in all 8 runs, and preferred density rose in all 8. This is consistent with weak selection, but the effect is small and the sample is limited.

## The Arena

### The question

How can bodies grown in the sandbox, with their structure and the way they behave, become building blocks for a particle-life world where they interact and evolve?

### How the design was reached

Each time a design seemed settled, the next step was to ask whether it was truly a new and likely-to-work approach, and to look one level deeper.

1. **Map settings to a particle-life force table.** Rejected: the grown structure is lost.
2. **Cut a living piece of the body.** Keep its particles, trail, veins and each particle's rules. This keeps the structure, but alone it gives nothing that keeps a piece together.
3. **A slime agent is nearly a Particle Lenia particle.** Its three sensors sample a field on a ring at sensor distance, which is Particle Lenia's ring kernel. The trail plays the part of Particle Lenia's field U. The difference is the growth curve: slime always wants more trail, while Particle Lenia prefers one density. Adding a crowding penalty above a preferred density turns slime sensing into Particle Lenia's energy, *E = R − G*. With the penalty off, it is classic slime again.
4. **Slime has memory that particle life lacks.** The trail records where particles *were*, the way Physarum's extracellular slime and a biofilm's matrix do. Specimens carry this memory into the arena.
5. **Imprint the structure into the rules.** Each particle's preferred density is set from the density it actually lived at when cut. The body's grown form becomes heritable rules, much like Waddington's genetic assimilation, where a form first produced by circumstance becomes encoded.
6. **Chemical identity instead of a hand-made force table.** Each founder gives off a mix of three shared chemicals. Its responses are solved so its own species' FOLLOW settings hold exactly. How it treats other founders then follows from how alike their chemicals are. With only three channels the interactions are low-rank, as in real signalling, and identity can drift, so mimicry and recognition can evolve.
7. **Shared fate.** A particle digests food only with chemicals it is drawn to, and best near its preferred density. Matter is conserved, and only regrowing food adds energy.

### Rules as implemented

- **Steering:** score = Σ response × chemical + forage × food × kin(*u*) − crowding × max(*u* − set point, 0)². Here *u* = log(1 + usable chemical), and veins add pull as in Solo.
- **Digestion:** kin(*u*) × exp(−(*u* − set point)² / 2σ²), with kin(*u*) = *u*² / (*u*² + 1). That is a Hill curve, the form used for cooperative binding. HOMEOSTASIS sets σ and the crowding strength.
- **Eating:** each particle takes food in proportion to what it can digest. Undigested food stays.
- **Food flow:** food spreads between neighboring cells at a rate set by their conductance. Veins conduct best, plain trail a little and open ground barely, like cytoplasmic streaming in Physarum's tubes. Flow is symmetric, so food is moved, never made.
- **Matter:** a particle is 0.3 units of matter plus its energy. Division splits both. Death returns both to the food field. Living costs energy that is not returned, and regrowth adds it, like sunlight.
- **Acclimation:** the set point moves 0.07% of the way toward the density actually experienced each step. The inherited value is a starting point, like phenotypic plasticity.
- **Homing:** if the most kin a particle senses, where it stands or at any of its three sensors, is below 35% of its set point, it reverses heading, with probability equal to HOMEOSTASIS. This resembles the direction reversals *Myxococcus xanthus* uses to stay with its swarm.
- **Heredity:** daughters inherit every gene with small changes, including the chemical identity. Claims use atomic maximums, so runs replay exactly.

### What happened as it was built

Every run below used the same four cached specimens, the same seed and LOW-to-MED founders on the RTX 4070.

| Version | Result |
|---|---|
| Classic sensing, simple eating | One colony grew from 33K to 200K particles and **spread over the whole world**. The average preferred density fell from 1.39 to 0.43 |
| Gated digestion | Everything starved. Particles removed food they could not digest |
| Eat only what you can digest | Populations held, but colonies still spread into territories that fill the world |
| Stronger homeostasis | Preferred density still **evolved downward**, from 2.0 to 0.8 |
| Cooperative Hill curve, foraging only near kin | **Bounded bodies formed**: rings and cell clusters. They starved slowly, with up to about 200 particles per food cell |
| Food flows through veins, faster eating | Populations stable or growing. A network lineage spread while ring bodies persisted |
| Acclimation, thinning large specimens | A body grown in a reaction-diffusion world survived transplant as a **membrane ring with particles of its second species inside**. All five lineages coexisted after 3,200 steps with food steady near 77%. Arena LIFE score 88, bodies part at maximum |

The downward drift of preferred density matches a known effect called **spatial sorting**. In an expanding population, the best dispersers end up at the front and breed with each other, as with cane toads evolving longer legs at their invasion front. Here, pioneers at the edge found fresh food. Individuality only held once cooperation made loners pay a real price.

Checks:

- Two replays of the same founders gave identical trail hashes.
- All five Solo regression hashes are unchanged.
- An arena step costs about 0.97 ms at MED, against 0.44 ms for Solo.

### Why bodies frayed, and homing

Before homing, the HOMEOSTASIS slider barely mattered. With two of the user's saves side by side, settings 0 and 1 looked almost the same after 4,000 steps. In a four-save arena, the winning lineage turned into a single network covering the world by step 8,000.

The cause: a particle only senses trail at three points just ahead of it. Once it wanders past that distance from its body, it sees nothing and drifts. Its trail then recruits others, and the body frays into a network. The crowding penalty only pushes particles *out* of dense spots, so nothing pulled wanderers back.

With homing, the same comparisons, run with copies of the user's saves on the same seed:

| Setup | HOMEOSTASIS 0 | 0.5 | 1 |
|---|---|---|---|
| "Silver Web IV" after 4,000 steps | Its second species spreads into a network, 162K particles | A few separate ribbon-shaped bodies, 113K | Ribbons, 97K |

In the four-save arena at the default 0.5, run for 12,000 steps:

- No network formed.
- The cell-like save stayed a C-shaped membrane holding its organelles (62K particles).
- The winner grew to 283K as separate ribbons and rings, not one sprawl.
- One lineage went extinct, and food stayed near 80%.

Replays still gave identical trail hashes.

### Measuring individuals, not just population

A lineage's share of the world is an ecological measure only. It says how much matter a lineage holds, not whether that matter forms individuals. For particle life, the questions that matter are:

- How many separate bodies are there, and how big are they?
- How long do they last?
- Do whole bodies divide?
- How far have their genes drifted?

The census now counts each lineage on a 96x54 grid and sums its genes. The Arena page tracks bodies by overlap between counts and reports bodies, divisions, deaths, lifespans and trait drift. In a first test, a ring-forming lineage held 2 to 5 bodies over 3,000 steps, with 8 recorded divisions and 7 deaths. At this resolution, many of these are pieces pinching off and rejoining, so they are best read as a measure of how often bodies split and fuse, not as clean reproduction.

### Cutting along the body

The first cut did not look for a body. It took a fixed circle (12%, 18% or 25% of the picture height) at the densest spot. Bodies larger than the circle were sliced, smaller ones came with the network around them, and strands passing through were cut loose.

The cutting bench finds bodies the way a hill shows its shape as water drains away. Particle density is measured on a 240x135 grid and smoothed. Dense regions are followed from a tight threshold (8.5 times the average density) down to a loose one (1.25 times). A region that stays one region, growing by less than 1.8 times per level, is the same body. Two that join become a separate candidate, the pair. Regions touching the frame are dropped. Each candidate is filled, so a membrane keeps what it holds, grown by two cells as a margin, and ranked:

| Measure | Weight | What it asks |
|---|---|---|
| Contrast | 30% | How much denser it is than a band around it |
| Steadiness | 25% | How many thresholds it survived |
| Enclosed space | 20% | How much of it is space inside a wall |
| Rim | 10% | Whether its edge is denser than its middle, like a membrane |
| Size | 15% | Whether the Incubator can hold it |
| Border | minus 40% | How much of it lies along the frame |

The particles inside the outline are cut, and the trail is masked with a soft edge, so passing strands stay behind.

**Tested on 16 saves with bodies.** Finding bodies took 130 to 260 ms. The top candidate was the body a person would point to in most of them: the inner cell of Bold Cyan Islands, the membrane-bound cells of Feathered Silver Honeycomb and Silver Web V, the large cell of Bold Blue-Teal Branches, and the rings of Flowing Blue Islands and Bold Cyan Web. Saves with no separate body, such as Dense Blue Lace, gave weak candidates, which is where the round cut remains useful.

**Does the body hold?** Six saves were cut both ways, placed alone and run for 2,000 steps. Outline cuts kept whole membranes and rings in four of six (Feathered Silver Honeycomb, Silver Web V, Bold Cyan Web, Flowing Blue Islands). Circle cuts of the same saves started as fragments, such as a crescent of a ring or two arcs of a membrane, and stayed fragments. Bold Cyan Islands fell apart either way. Its body is shaped by a reaction field, which the Incubator does not carry. 17 of the 31 saves tested use a reaction field, so this is the next limit on incubation.

**Thinning.** Every cut had been thinned to 60,000 particles. A body cut from a Batch tile is enlarged four times in particle count, so thinning left as little as 22% of its density. Raising the limit to 200,000 kept bodies brighter and closer to their original from the first step. Bodies still thinned are ones that would take over 40% of the world.

### Copies and sizes

A specimen from the drawer can be placed many times. The copies placed while one card is picked form one strain, with one chemical identity, so they treat each other as kin instead of as rivals. A copy's size can be changed from ×0.5 to what fits the dish. A body's size comes from its rules, mostly how far its particles sense and how far they move each step, so a plain enlargement would shrink back. Each copy therefore has its sensing reach and speed scaled with it, and its particle count scaled with its area, so its density stays the same. This is close to a true scaled copy but not exact, because trail spreads and fades by the same amount per step at any size.

In a test, a cut of Feathered Silver Honeycomb was placed at ×0.6, ×1 and ×1.35. The ×0.6 copy kept its membrane-bound shape for 2,500 steps. The ×1 and ×1.35 copies were placed overlapping and fused into one body, which is what kin are expected to do.

### Why cut bodies change in the Incubator

**The question.** A body cut on the bench often loosens or changes shape once it is placed. Is that because it was cut away from the rest of its organism, because the Incubator has no reaction field, or because the Incubator's own rules differ from the Microscope's?

**How it was tested.** Twelve saves were each cut along their best body. Each body was then followed for 2,000 steps, from the same starting moment, in seven ways:

| Run | What is different |
|---|---|
| Whole world | Nothing. The organism keeps running as saved. This is the reference. |
| Alone | Everything outside the cut is removed: the other particles and the trail around. Same rules, same world. |
| Alone, field cut too | As above, and the reaction field outside the cut is cleared, as if the field were carried with the specimen. |
| Alone, no field | As above with the field switched off, which is what the Incubator does today. |
| Dish now | The cut placed in the Incubator as it works today. |
| Dish, no life or death | The Incubator with eating, dividing and dying switched off. |
| Dish, solo moves | The Incubator with only the Microscope's movement rules left: no crowding, homing or pull toward food. |

Each run was compared with the whole-world run at the same step: how much of the body stayed within the natural body's reach, and how alike the two bodies were from middle to edge, where 1 means the same and 0 means nothing alike. The contact sheets show every run after 2,000 steps: [saves with a field](research/hold-field-saves.webp) and [saves without one](research/hold-plain-saves.webp).

**What was found.**

1. **Cutting a body away from its organism is not the problem.** Alone in its own world, 9 of 12 bodies stayed 89 to 100% alike to the whole-world run. A body does not need the rest of its organism around it.
2. **Some saved bodies change even at home.** In its own whole world, Bold Cyan Islands' ring pulls into a tight knot within 600 steps, and Sparse Silver Islands' bright blob grows by three quarters. A save is one moment, and some moments are passing. No change to the Incubator can keep a shape that the organism does not keep itself.
3. **The reaction field shapes some bodies from the inside.** Without the field, Bold Blue-Teal Branches keeps its outer wall but loses the honeycomb inside it, and Bold Cyan Islands becomes a plain blob. With the field cut along with the body, both keep their inner structure. The other five field saves kept their shape without the field, but lost its glow, which is part of how they look.
4. **Three shared chemicals blur bodies made of several species.** The Incubator mixes every species into three shared chemicals, and each chemical fades at the average rate of the species using it. In Sparse Azure Islands, one species' trail lasts about 7 steps and the other's about 500. Averaged, the long-lasting species loses the trail it follows and breaks into loose worms. Giving each species its own chemical, fading at its own rate, brought the body back: 98% alike instead of 81%. See [own chemicals, first four](research/own-channels-a.webp) and [last four](research/own-channels-b.webp).
5. **The food economy starves some bodies.** At the default settings, 4 of 8 bodies lost 25 to 52% of their particles within 2,000 steps, and their structure wore away with them. Bold Azure Islands' dots melted into a dark smear. With FOOD at 1 and METABOLISM at 0.5 none died off, but most then grew by 10 to 50%.
6. **The Incubator's extra steering matters less.** Removing crowding, homing and the pull toward food helped some bodies and hurt others. Switching off the vein growth that the dish's trail always has did the same. Neither is a main cause.

Two results are left open. Sparse Silver Islands' bright blob turned into a ring in the dish in every version tested, even with matching rules, and the cause was not found. Dense Azure Honeycomb had no separate body, so the bench fell back to a circle on the corner of a frame line, and its result says nothing about bodies.

**What this points to**, in order of payoff:

1. Give every species its own chemical in the dish, so its trail fades and spreads as it did at home.
2. Carry the reaction field into the dish with the specimen.
3. Balance the food economy, so a newly placed body neither starves nor balloons.
4. On the bench, check whether a body holds its shape at home before it is cut, and say so.

### Acting on it: six chemicals, food that reaches bodies, strains that keep their size

**Six chemicals.** The dish now has six chemicals in two trail maps, each with its own fade and spread. Each species placed gets one of its own while any are free, so its trail behaves exactly as at home. Once all six are taken, a new species shares the chemical whose trail lasts and spreads most like its own. A founder keeps the chemicals it was given, so placing a new one never changes those already in the dish, and replays stay exact. Each species shows in its organism's own colors. Toward a chemical that is not its own organism's, a species behaves as toward a stranger: with half the attitude it had toward its partners at home, or a slight wariness (−0.25) if it had none. Rivals at home avoid strangers, and allies are drawn to them.

**Keeping bodies fed.** With the six chemicals in place, the same eight bodies were placed alone and run for 3,000 steps under several food economies. The table gives the range across the eight of particles alive relative to placed (1 means the same number), and the contact sheet shows the final versions ([sheet](research/keeping-fed.webp)):

| Setting | Particles alive after 3,000 steps |
|---|---|
| Before: the economy as it was | 0.27 to 1.29. Four bodies starved below 0.7, two grew |
| FOOD at 1 | 0.63 to 2.36: fewer starve, the rest balloon |
| Easier shared digestion, a wider band of digestible density, or faster settling of the set density | No real change |
| Dividing only where kin are thinner than the set density, or than where the particle was placed | Barely limits growth. Slime particles travel along their paths, so a density one particle remembers does not belong to a place |
| Food flowing 2.5 times more freely across the broth | Every body survives, and grows until the dish is full |
| That, and a size each strain may grow to | Exactly at the limit for all eight, at 1,000 and at 3,000 steps |

Two findings made the difference. First, **the starving bodies were not short of food overall**: 80 to 95% of the dish's food was left uneaten. A dense body eats out its own patch faster than food spreads back in, so it starved with food all around it. Letting food flow more freely into bodies ended that. Second, **once fed, bodies grew without limit**. A size limit counted on the GPU each step, summed per workgroup so the result doesn't depend on thread order, stops that. The first version still overshot to 1.5 to 1.8 times, because a whole well-fed body divided in the same step. Now each fed particle near the limit divides only by a draw weighted by the room left.

The limit comes from HOMEOSTASIS: a strain may grow a tenth past its placed size at 0.5, holds exactly at 1, and has no limit at 0, which stays classic slime.

By the shape measure used above, the eight bodies' average likeness to themselves at home did not change: 0.70 now against 0.71 before. What changed is that none starve or balloon, and in the pictures several hold better. Bold Azure Islands keeps its separate dots instead of melting into a smear, and Bold Cyan Web loses the dark tangles of a dying species. The measure only compares how particles are spread from the middle outward, so it misses details like these.

**Steady at home.** While the bench opens, a copy of the source runs on out of sight for 900 steps, and each body found is compared with itself. It counts as steady if its particles are spread the same way from middle to edge (at least 80% alike) and about as far (within 0.8 to 1.25 times). This adds 0.3 to 0.8 seconds. It agrees with what the bodies did at home in the study above:

| Body | At home in the study | The bench says |
|---|---|---|
| Bold Cyan Islands, A | Its ring pulls into a knot | Changes (alike 23%, size ×0.72) |
| Bold Blue-Teal Branches, A | Grows by a third or more | Changes (alike 64%, size ×1.33) |
| Silver Web V, A | Holds | Steady (alike 98%) |
| Silver Web IV, A | Holds | Steady (alike 98%) |
| Flowing Blue Islands II, A | Holds | Steady (alike 94%) |
| Bold Cyan Web, A | Holds | Steady (alike 95%) |
| Bold Azure Islands, A | Holds | Steady (alike 88%) |
| Sparse Silver Islands, A | Holds at 600 steps, grows by 2,000 | Steady (alike 86%, size ×1.06): too slow a change to catch in 900 steps |

### Carrying the reaction field

**How it works.** A cut from an organism with a reaction field takes the field from under the body, with the same soft edge as its trail. It also takes the field's recipe: the feed and kill rates of its Gray-Scott reaction, and how strongly its trails seed it. Each species records how strongly it followed or fled the field, on the dish's trail scale. The dish runs its own Gray-Scott field on the food grid, 480×270 like the Microscope's. A specimen placed at its true size lands with its field cells exactly on the dish's. A copy placed smaller has its field spread less, so the pattern shrinks with the body.

The dish has no single recipe. Each particle carries its strain's recipe as a number into a small table and gives the recipe off where it lives, into maps that blur and fade like a trail. Each cell runs the recipe given off there, so a strain's field runs where the strain is, follows it as it moves, and fades back to plain broth where no strain keeps it. Strains with different fields can share the dish. Each species' trail seeds the field scaled by a third of its typical level at home, as the Microscope scales it, so a long-lasting trail doesn't seed more than a fleeting one.

**Result.** Eight bodies from organisms with a field were run for 2,500 steps and compared with the same body alone at home, its field cut along with it ([sheet](research/field-carried.webp)):

| Body | Dish without the field | Dish with the field |
|---|---|---|
| Flowing Blue Islands | 0.56 | 0.77 |
| Bold Cyan Islands | 0.55 | 0.63 |
| Flowing Blue Islands II | 0.71 | 0.76 |
| Bold Blue-Teal Branches | 0.52 | 0.56 |
| Silver Web IV | 0.89 | 0.92 |
| Silver Branches | 0.33 | 0.34 |
| Bold Cyan Web | 0.92 | 0.87 |
| Bold Azure Islands | 0.78 | 0.73 |

Five improve and two drop a little by this measure, which only compares how particles spread from the middle outward. The pictures show more. Flowing Blue Islands keeps its ring of field dots, Bold Cyan Islands keeps its knot inside rings of field, Flowing Blue Islands II keeps its dotted halo, and Bold Blue-Teal Branches has the field's dots inside its cell again. Its honeycomb of inner walls comes back only in part.

The field in the dish runs at about the strength it had at home. Around Silver Web IV, the field's living chemical averaged 0.14 in the dish against 0.10 at home. Silver Branches' field runs about three times stronger than at home, and the cause was not found. A field now glows in its organism's own field colors and glow.

**A sparse body starving with food around it.** Flowing Blue Islands died out in the dish, field or not, with 95% of the food left. It is a thin ring with a low set density (0.24). Shared digestion was measured against a fixed amount of kin, so a body that is sparse by nature could never eat enough. It now asks for kin at a share of the particle's own set density (half point 0.7). With that, all ten bodies tested held at 1.1 times their placed size over 3,000 steps, Flowing Blue Islands included, and the field cut keeps 77% of its likeness.

**Cost.** The recipe maps and four field steps per dish step add 0.04 ms, for 1.39 ms per step at 1080.

### Room for more: the size of the dish

**How big specimens are.** Bodies cut so far have radii from 9% to 42% of the picture height. At ×0.5, the smallest size allowed now, one copy covers 1 to 18% of the dish, typically about 7%. That leaves room for a handful of copies, not many.

**Placing smaller.** Five bodies were placed at ×1, ×½, ×⅓ and ×¼ with life and death switched off, and each was compared with its full-size copy ([sheet](research/smaller-copies.webp)):

| Body | ×½ | ×⅓ | ×¼ |
|---|---|---|---|
| Silver Web V | 98% | 93% | 88% |
| Sparse Silver Branches | 92% | 89% | 85% |
| Bold Azure Islands | 90% | 88% | 75% |
| Sparse Azure Islands | 85% | 76% | 62% |
| Flowing Blue Islands II | 82% | 59% | 40% |

Bold, simple bodies hold down to about ⅓. Thin rings and fine lace fade and blur. Trail spreads and fades by a fixed number of pixels each step at any size, so in a smaller copy its features blur relative to its size, and a line one or two pixels wide cannot shrink at all.

**A bigger dish.** The faithful way to fit more is to keep each specimen at its true size and give the dish more pixels. Measured on this computer's NVIDIA graphics card (an RTX 40-series, Lovelace generation), with about a third of the dish filled:

| Dish height | Particles | GPU memory | Time per step | At 1× | At 8× |
|---|---|---|---|---|---|
| 1080 (now) | 500,000 | about 155 MB | 0.7 ms | 60 fps | full speed |
| 1620 | 1,125,000 | about 350 MB | 1.3 ms | 60 fps | full speed |
| 2160 | 2,000,000 | about 620 MB | 2.4 ms | 60 fps | about 70% of full speed |

These were measured with three chemicals. With six, a step at 1080 costs 1.35 ms instead of 0.7, and the dish uses about 90 MB more, so the bigger dishes will cost about twice what the table shows. At 1080 it still runs at 60 frames a second and full speed at 8×.

A 1620 dish holds 2.25 times as many copies, and a 2160 dish four times as many. Three things come with it:

- **Seeing it.** In a 1600×1000 window the dish is drawn about 650 pixels high, so a 2160 dish is shown at 30% of its size and lines one or two pixels wide shimmer. A bigger dish needs a way to zoom in and move around.
- **Graphics card limits.** Without asking the card for more, one buffer holds at most 128 MiB, which caps the dish at about 2 million particles.
- **The field grid.** A carried reaction field needs its grid to grow with the dish, so its patterns keep their size.

### Building it: three dish sizes, zoom and saved dishes

The Incubator now offers 1×, 1.5× and 2× dishes (1080, 1620 and 2160 pixels high). A pixel is the same size in all three: genes, specimen sizes and kept bodies are measured against a 1080-high picture, and every grid grows with the dish rather than its cells. The food and reaction field keep one cell per 4 pixels, the body counter 20 pixels and the strain highlight 8. The dish's shaders are built for each size with those numbers written in. The fade at the picture's edge, which used to be 6% of the height, is now a fixed 65 pixels.

**The 1× dish is unchanged.** A two-strain run with a reaction field, 300 steps, gives bit-for-bit the same trails, broth, field and particles as before the change.

**A body is the same in every dish.** One half-size copy of Bold Blue-Teal Branches was placed in the middle of each dish. After 12 steps its trail differed between dishes by about 1 part in 10,000: rounding, since a number's precision depends on how far it is from the picture's corner. After 400 steps its particles were spread the same way around the middle in all three, to within 0.2% at every distance from 25 to 300 pixels. A body kept in a 2× dish and placed in a 1× dish lands with every one of its 161,250 particles.

**Cost**, with six chemicals, on the RTX 40-series card, with a third or more of the dish filled:

| Dish | Particle places | GPU memory | One step | At 1× | Fastest |
|---|---|---|---|---|---|
| 1× (1080) | 500,000 | about 270 MB | 1.4 ms | 60 fps | 8×, 480 steps a second |
| 1.5× (1620) | 1,125,000 | about 600 MB | 3.5 ms | 60 fps | about 180 steps a second |
| 2× (2160) | 2,000,000 | about 1.1 GB | 6.0 ms | 60 fps | about 120 steps a second |

At 8×, a full 2× dish first fell to 12 frames a second: the speed control took away one step per frame every 20 frames, too slowly to catch up with a queue already far behind. It now halves the steps per frame at once when the card is more than 40 ms behind, and the same dish settles at 60 frames a second, as fast as the card allows. The genes of 2 million particles fill 128 MB, just under the 128 MiB a buffer may hold without asking the card for more, so 2× is the largest dish without that.

**Seeing it.** Scrolling zooms toward the pointer and dragging moves around, up to 8 times magnification in a 1× dish and 16 in a 2×. The round window never looks past the glass. Where the picture has more pixels than the screen, as a 2× dish shown whole does, each screen pixel now averages four samples, so fine trails no longer shimmer. This also smooths the Microscope at MED and HIGH, where the picture was always larger than the screen. Pictures saved with IMAGE always show the whole dish at full size; clips and recordings film what you see.

**Smaller copies.** Copies can now be placed down to ×⅓, where the bold bodies above keep 88 to 93% of their likeness.

**Saved dishes.** A saved dish holds every particle place (position, heading and random state), the genes of the living particles, both trail maps, the broth, the reaction field and both recipe maps, and each strain's chemistry, size limit, history and body map. Trails drop their 13 least visible bits, keeping about three significant digits, as body files do; everything else is exact. The test rounds the live trails the same way before saving, then runs the original 300 more steps, opens the saved dish and runs it 300 steps: trails, broth, field and every particle came out bit-for-bit the same, in a 1× and a 2× dish. Body identities carry over too, so a body's age keeps counting. With two strains, the file was 18.6 MB for a 1× dish and 29.9 MB for a 2× dish, saved in about 3 and 5 seconds and opened in 0.5 and 0.9.

### What is new here, honestly

- **Likely new:** cutting evolved slime bodies into specimens with **imprinted density set points**, treating slime agents as Particle Lenia particles with a memory field, and deriving cross-species interactions from a **low-rank chemical identity** solved to keep each founder's own relations. A literature search for these combinations was not done, so this is a judgment, not a claim.
- **Known ideas, combined:** Particle Lenia's energy, Flow-Lenia's rules carried with matter and conserved mass, cooperative digestion, nutrient transport through veins, and non-reciprocal chemical interactions between particle types.
- **Not achieved yet:** whole bodies dividing into two, a membrane made of material the cell produces, as in Cabaret's vesicles, and long-run open-ended evolution.

### LIFE score version 2

The tagged saves showed what version 1 missed:

- **False positives:** an even reaction-diffusion texture, a dense foam filling the frame, and a frame locked into straight lines.
- **False negatives:** a ring of particles enclosing a second species, and bright orbs in a crystal lattice that was called NOISE.

Four measures were added from the probe map: coarse-scale bodies that stand apart from their surroundings and don't touch the frame, variety between blocks of the frame, the share of trail in a border band, and the share of edge strength within 7.5° of horizontal or vertical.

They were calibrated on each save's thumbnail, because thumbnails show exactly what was tagged:

- **Grid** separated the stuck-lines save (0.92) from every other save (at most 0.47).
- **Variety** separated the even textures (0.17) from the cell-like saves (about 1.0).
- A truly noisy organism had 0 loops, while the crystal lattice had 221. NOISE now requires few loops.

## Reading status

| Source | What was read |
|---|---|
| Flow-Lenia | Abstract and most of the HTML paper |
| Physarum review (Sun) | Most of the paper, including the conductivity equation |
| Tero 2007, Tero 2010, Nakagaki 2007 | Citations and summaries only. Their equations were confirmed through the review |
| Vasas 2012, Beisson & Sonneborn 1965, chemoton, Jones 2010 | Search summaries only. **Read the full papers before relying on details** |
| Particle Lenia | The full article: kernel, growth, repulsion, energy and update rule |
| Cabaret 2024, autopoietic vesicles | A summary of the HTML paper. Force formulas and parameters are only in its code |
| Agudo-Canalejo & Golestanian 2019, particle life, Ventrella's Clusters | Search summaries only |
| Spatial sorting, cooperative digestion in yeast, Physarum's slime memory, genetic assimilation | Background knowledge, not re-read for this work |

## Sources

- Plantec, E., et al. (2022). [Flow-Lenia: Towards open-ended evolution in cellular automata through mass conservation and parameter localization](https://arxiv.org/abs/2212.07906). arXiv:2212.07906.
- Tero, A., Kobayashi, R., & Nakagaki, T. (2007). [A mathematical model for adaptive transport network in path finding by true slime mold](https://eprints.lib.hokudai.ac.jp/dspace/handle/2115/28041). *Journal of Theoretical Biology*, 244(4), 553-564.
- Tero, A., et al. (2010). [Rules for Biologically Inspired Adaptive Network Design](https://doi.org/10.1126/science.1177894). *Science*, 327(5964), 439-442.
- Nakagaki, T., et al. (2007). [Minimum-Risk Path Finding by an Adaptive Amoebal Network](https://link.aps.org/doi/10.1103/PhysRevLett.99.068104). *Physical Review Letters*, 99, 068104.
- Sun, Y. (2017). [Physarum-inspired Network Optimization: A Review](https://arxiv.org/abs/1712.02910). arXiv:1712.02910.
- Vasas, V., Fernando, C., Santos, M., Kauffman, S., & Szathmáry, E. (2012). [Evolution before genes](https://doi.org/10.1186/1745-6150-7-1). *Biology Direct*, 7, 1.
- Beisson, J., & Sonneborn, T. M. (1965). [Cytoplasmic inheritance of the organization of the cell cortex in Paramecium aurelia](https://doi.org/10.1073/pnas.53.2.275). *PNAS*, 53(2), 275-282.
- Gánti, T. [The Principles of Life](https://academic.oup.com/book/4974/chapter/147439774). Oxford University Press. Introduces the chemoton model.
- Jones, J. (2010). [Characteristics of pattern formation and evolution in approximations of Physarum transport networks](https://doi.org/10.1162/artl.2010.16.2.16202). *Artificial Life*, 16(2).
- Mordvintsev, A., Niklasson, E., & Randazzo, E. (2022). [Particle Lenia and the energy-based formulation](https://google-research.github.io/self-organising-systems/particle-lenia/). Google Research.
- Cabaret, T. (2024). [Emergence of autopoietic vesicles able to grow, repair and reproduce in a minimalist particle system](https://arxiv.org/abs/2311.10761). arXiv:2311.10761.
- Plantec, E., et al. (2025). [Flow-Lenia: Emergent evolutionary dynamics in mass conservative continuous cellular automata](https://arxiv.org/abs/2506.08569). *Artificial Life*, 31(2), 228-248.
- Agudo-Canalejo, J., & Golestanian, R. (2019). Active phase separation in mixtures of chemically interacting particles. *Physical Review Letters*, 123, 018101. [Press summary](https://www.ds.mpg.de/3426225/190619_pm_prl_agudo_canalejo).
- Shine, R., Brown, G. P., & Phillips, B. L. (2011). An evolutionary process that assembles phenotypes through space rather than through time. *PNAS*, 108(14), 5708-5711.
- Gore, J., Youk, H., & van Oudenaarden, A. (2009). Snowdrift game dynamics and facultative cheating in yeast. *Nature*, 459, 253-256.
- Reid, C. R., et al. (2012). Slime mold uses an externalized spatial "memory" to navigate in complex environments. *PNAS*, 109(43), 17490-17494.
- Waddington, C. H. (1953). Genetic assimilation of an acquired character. *Evolution*, 7(2), 118-126.
