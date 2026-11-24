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

## Reading status

| Source | What was read |
|---|---|
| Flow-Lenia | Abstract and most of the HTML paper |
| Physarum review (Sun) | Most of the paper, including the conductivity equation |
| Tero 2007, Tero 2010, Nakagaki 2007 | Citations and summaries only. Their equations were confirmed through the review |
| Vasas 2012, Beisson & Sonneborn 1965, chemoton, Jones 2010 | Search summaries only. **Read the full papers before relying on details** |

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
