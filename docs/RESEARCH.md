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
