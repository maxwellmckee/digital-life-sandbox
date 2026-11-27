# Ideas

Where the sandbox could go next, and what has been done. Each idea says what it is, why it might help, and roughly how
big it is (small, medium or large). The status is one of **done**, **in progress**, **next** or **idea**; when an idea
is built, its line names the commit.

The guiding rule for all of them: life-like behavior has to come from the rules each particle carries, not from rules
that look at a whole strain, body or dish (see [Which rules carry the cells](RESEARCH.md#which-rules-carry-the-cells)).

## Why the dish needs more than one way to win

Specimens arrive in the Incubator genuinely different: across the saved slides, sensor angle runs from 5 to 90°, reach
from 2 to 64, turning from 4 to 90° and speed from 0.2 to 3.2. But the dish rewards a single strategy, sit tight and
spend as little as possible, so every strain evolves toward it: in long runs, speeds fell 2 to 10 times and set points 4
to 10 times, and differences between strains faded within about 10,000 steps. In ecology, diversity lasts where there
is more than one way to make a living. The ideas in A give the dish that; B and C give particles and the breeding more
room to differ. First results: [More than one way to win](RESEARCH.md#more-than-one-way-to-win-patchy-food-and-two-foods).

## A. More than one way to win in the dish

| | Idea | Why | Size | Status |
|---|---|---|---|---|
| A1 | **Patchy, drifting food.** Food grows in slowly moving patches, like sunlight, instead of evenly everywhere. | Moving pays again: fast foragers that follow the patches and slow, frugal settlers can both do well. | Small to medium | **done** (PATCHES), 13676e0 |
| A2 | **Two kinds of food.** Each strain digests some kinds better than others, set by a gene. | Strains can specialize and live side by side instead of one winning (resource partitioning). | Medium | **done** (FOODS, diet gene), 13676e0 |
| A3 | **Predators.** A gene that lets particles eat other strains' particles. | Hunters and prey, chases, arms races, and a real reason to stay in a tight body. | Medium to large | idea |

## B. Particles that do more than one thing

| | Idea | Why | Size | Status |
|---|---|---|---|---|
| B1 | **Two modes per particle**, such as "wander" and "hold on", switched by local cues like crowding or hunger, with genes setting the switch points. | Bodies could grow a distinct rim and core, shed spores or send out foraging fronts: the first step toward cell types. | Large | idea |
| B2 | **Inherited cohesion.** Homing and crowding become genes. | Holding together becomes a strategy that can win or lose, not a fixed law. Built: in 100,000 steps the winning strain drifted toward holding together, but the dish's structure was the same as with fixed cohesion. | Medium to large | **in progress**: built, not yet committed |
| B3 | **Signals.** A cheap chemical used only to communicate, like quorum sensing in bacteria. | Strains could evolve to swarm when crowded or scatter when starving. | Medium | idea |
| B4 | **Placed specimens start with a spread of homing and crowding**, as their set points already do. | Selection gets variation to sort from the first step, instead of waiting for mutation ([Inherited cohesion](RESEARCH.md#inherited-cohesion)). | Small | idea |
| B5 | **Straying costs the stray.** "Lost" is measured against the kin-density minimum, as digestion is. | A particle that wanders off starves sooner itself, so homing pays the particle and not just its body. A rule change, so it needs its own test. | Small | idea |

## C. Breeding for behavior, not just looks

| | Idea | Why | Size | Status |
|---|---|---|---|---|
| C1 | **A test dish for every specimen.** Each runs alone in a small standard dish for a few thousand steps; its card shows how much it moves, holds together, grows and divides. | You could see and compare how specimens behave, not only how they look. | Medium | **done** (TEST, BEHAVIOR line), ba6df22 |
| C2 | **A diversity breeding mode for BATCH**, which fills in behaviors your collection does not have yet (novelty search, MAP-Elites) instead of steering toward past picks. | Steering toward what you liked narrows the search over time; this widens it on purpose. | Medium | idea |
| C3 | **Breed slides under the Incubator's physics**, with real food in the Microscope. | Specimens would arrive already adapted to the dish and keep their differences. | Medium to large | idea |
| C4 | **Let trail deposit mutate.** It is 1 in every saved slide. | Frees one gene that never varies. | Small | idea |

## D. Further out

- **Membrane material made by the particles themselves, and whole bodies that divide** (in the README's next steps).
- **A secreted enzyme in place of cooperative digestion**, so cooperation becomes a public good that cheaters can
  exploit (from the emergence audit, `update_notes/`).
- **Detecting division:** one cell becoming two that both last, followed by the cell finder.
- **Using the ECOSYSTEM score to compare dishes** over long runs, to see which settings and strains make the richest
  ecosystems.
- Endosymbiosis-like dependence between strains, a first-run gallery of presets, parameter locks for RANDOM, a replay
  timeline, mutating only part of a body, and small evolvable brains.

## Done

| What | Commit |
|---|---|
| Cell finder: CELLS boxes, best three, KEEP CELL, cells kept with saved dishes | 1ed840b |
| Steadier Incubator console; README picture of found cells | 7032440 |
| Strain cap removed; square Incubator pictures and films; readouts explained; shorter help | 228ab77 |
| Energy only from food (leak fixed); food limits growth | a5249ee |
| ECOSYSTEM score | 4599ddd |
| Digestion needs a minimum density of kin; STRUCTURE added to the score | fe0853e |
| Patchy, drifting food (PATCHES) and two kinds of food with a diet gene (FOODS) | 13676e0 |
| Specimen tests: TEST, TEST ALL and a BEHAVIOR line on every specimen card | ba6df22 |
