# The big picture

A ten-minute read: what this project is, its rules, how it works, where it stands, and where to find the details.
Written so either of us can pick up the thread after a burst of changes. When the big picture changes, this page
changes with it. Last brought up to date on 2026-11-27.

## In one paragraph

Digital Life Sandbox is a GPU simulation in one web page that tries to grow **digital life from the bottom up**. Slime
mold organisms are grown and bred in a **Microscope**; living bodies are cut out of them as **specimens**; specimens are
moved into a shared petri dish, the **Incubator**, where every particle must feed, hold together and divide on its own,
passing mutated genes to its daughters; and everything that happens there is measured honestly. The aim is twofold:
beautiful, organic forms that are discovered rather than drawn, and digital life that holds together as individuals
and, one day, reproduces as whole bodies.

## The rules of the game

**Bottom-up is allowed.** We may give particles rules and genes, and the world physics, then study the patterns,
structures and behaviors that emerge. A rule is legitimate when it acts on **one particle** using only what that
particle **senses or carries**: its position, the trails and food where it stands or where its sensors reach, its
energy and its genes. The world can have physics too (sunlight that regrows food, trails that fade and spread), as long
as it acts the same way everywhere.

**Top-down is not allowed.** No rule may look at a whole body, strain or dish to decide what a particle does, or name
the result it wants ("a strain holds its size"). When one slipped in, it came out: the **strain cap**, which counted
each strain across the dish, was removed once tests showed the cells did not need it
([Which rules carry the cells](RESEARCH.md#which-rules-carry-the-cells)).

Three things sit outside the rules, on purpose:

- **Observers** may look at the whole dish, because they only read it: the cell finder, the ecosystem score, the
  division count and the strain stats never change what happens.
- **Your choices** are artificial selection, like a breeder's: picking slides to breed, choosing what to cut, keeping a
  body. They make the art, but they are kept out of claims about what emerged.
- **One honest compromise:** a dish has a fixed number of particle places (half a million to two million), and a
  birth needs a free one. Food is tuned to run out before room does, so food usually sets the limit, though a very
  thrifty strain can come close to filling a dish in a long run.

Every new rule is described first, checked for which level it acts at, and tested by switching it off and comparing.

## The process: grow, cut, test, watch

```
 MICROSCOPE              CUTTING BENCH             INCUBATOR                ARCHIVE
 grow and breed   --->   cut a living body  --->   a dish of strains  --->  slides, specimens,
 slime organisms         into a specimen           compete and evolve       dishes, kept cells
       ^                                                  |
       '-------------- KEEP a body or a cell -------------'
```

1. **Grow** ([GUIDE: Microscope](GUIDE.md)). A slide holds one organism of up to three slime mold species. In SOLO you
   watch one; in BATCH you breed a tray of nine by picking the ones you like, and the lab learns your taste. A child can
   inherit its parent's grown body, not just its rules. BIOLOGY adds layers: VEINS (busy paths thicken), CELLS (agents
   with energy that divide, die and pass on mutated rules) and FED (cells on a real broth, so what you breed can live on
   food).
2. **Cut** ([GUIDE: The Incubator](GUIDE.md#the-incubator)). The cutting bench finds the bodies in a slide; you cut one.
   A specimen keeps every particle inside the cut with its species' rules, and each particle gets a **set point**: the
   density it lived at in the body, imprinted so the specimen carries its own structure. Each specimen can be tested
   alone in a standard dish; its card then says how it travels, holds together and changes size.
3. **Test in a dish**. Specimens are placed into the Incubator's broth, each founding a **strain**. They live on finite
   food, beside rivals, and, if you turn them on, against challenges: food in drifting patches, two kinds of food, and
   predators. Bodies that cannot sustain themselves die back.
4. **Watch and measure**. The dish counts bodies, finds cells and scores them, judges itself as an ecosystem, and counts
   real divisions. You can KEEP a body or a cell that formed there, which becomes a new specimen, and save the whole
   dish, which reopens exactly.

What is new about this: breeding bodies for looks, then cutting them into particles that carry their own rules and a
remembered density, then stress-testing them under real scarcity, joins slime-mold growth to particle life in a way we
have not seen elsewhere ([what is new, honestly](RESEARCH.md#what-is-new-here-honestly)).

## The rules particles follow today

### In the Microscope

Slime mold agents, as in Jeff Jones's Physarum model. Each step an agent senses the trails ahead of it with three
sensors, turns toward what its species likes (each species follows or flees each trail, set by its ecology), moves and
leaves its own trail, which spreads and fades. A slide can also carry a **reaction field** (Gray-Scott) that its trails
seed and its agents follow. With CELLS, each agent also has energy and its own copy of the movement rules, divides when
full and dies when starved. With FED, that energy comes only from a broth. Details:
[RESEARCH: the rules as implemented](RESEARCH.md#the-rules-as-implemented), [Breeding on real food](RESEARCH.md#breeding-on-real-food-fed).

### In the Incubator

**What each particle carries** (its genes, passed on with small mutations at every division): energy; its strain; its
sensor angle and reach, turning and speed; how much trail it lays; its **set point**; how much of each of six chemicals
it gives off and how it responds to each; how strongly it is drawn to food; its pull toward a reaction field and the
field recipe it carries; its **diet** (which food it digests); its **homing** and **crowding**; its **hunting**; and a
**kin mark** shared by its specimen's particles.

**What each particle does, every step:**

- **Senses and moves.** It scores the spots ahead of it by the chemicals it likes and dislikes, the food it is drawn to,
  and how crowded they are past its set point, and turns toward the best.
- **Homing.** If it senses too little of its own kind, it turns back, the way swarming bacteria reverse to stay with
  their swarm.
- **Crowding.** It is pushed out of places denser than its set point.
- **Eats, only in company.** It reports how much it can digest where it stands; each spot's food is then shared out in
  exactly those amounts. It digests best near its set point, and only with enough kin around, measured against its
  set point but never against less than a fixed minimum, so a loner can barely eat and spreading thin never pays.
- **Pays for living.** Living, moving and laying trail cost energy, which is never given back.
- **Divides and dies.** Full, it builds a daughter nearby from its own matter and energy; starved, it dies and its
  matter returns to the broth. Its set point drifts slowly toward the density it actually lives at.
- **Hunts, if HUNTING is on.** A hunter bites strangers it touches, keeping half of what it takes; its kin mark spares
  its own kind, and a particle surrounded by kin is hard to bite.

**The world's physics:** a broth that regrows like sunlight and flows between spots, faster along veins; energy only
from food (a test checks that none is made from nothing); six chemicals that each fade and spread at their own rate;
reaction fields carried by the particles. A membrane prototype (crowding shades and blocks food, rim particles pump it
inward) exists for research and is off. Details: [ARCHITECTURE: How it works](ARCHITECTURE.md#how-it-works).

## Where it stands

**Achieved** (the full table is in the [README](../README.md#milestones)): organisms that grow bodies; specimens cut
from living bodies; energy only from food; lasting individuals rather than mush; competition, coexistence and
predators; cell-like structures that form on their own and are found and scored; specimens bred to live on food
(across 34 slides, fed cuts kept their size where others lost two thirds); and real divisions told apart from
look-alikes.

**Not yet:** whole bodies that divide; homeostasis, an inside that a cell maintains; membrane material made by the
particles; cell types; open-ended evolution. Division has been the main hunt. Cores can split, as in Amoeba K-461, but
bodies never part: nothing makes a large body unstable, because the rules that hold a small body together hold a large
one just as well. The whole story, with pictures: [The search for division](DIVISION.md).

## Where it is headed

1. **A body that loosens as it grows** ([IDEAS B6](IDEAS.md)), so a body with two cores could part at its waist.
2. **Breeding on FED across generations**, so selection itself can favor whatever divides.
3. **Particles with two modes** ([IDEAS B1](IDEAS.md)), the first step toward cell types such as a rim and a core.
4. Further out: membrane material made by the particles, and long runs judged for open-ended evolution.

## How we work

- **Describe first, then build.** Changes to what you see are described and agreed before they are made; a real choice
  is asked as one question.
- **Measure before changing.** Big questions get a research run first (on copies, never your real saves), across many
  specimens rather than the same few, with pictures. Results, including failures, go into
  [RESEARCH.md](RESEARCH.md), a notebook kept in order.
- **Nothing breaks quietly.** The test suite (`.\tests\run.ps1`, now 19 checks) runs before every commit, and old saves
  and dishes keep opening exactly as they were saved.
- **Ideas are tracked** in [IDEAS.md](IDEAS.md) with letters and numbers (A3, B6, C3...). Naming one is the quickest
  way to steer: "let's do B6".

## Where to find things

| Looking for | Go to |
|---|---|
| The pitch, screenshots and milestones | [README](../README.md) |
| How to use every room, control and key | [GUIDE.md](GUIDE.md) |
| How it works inside, file formats, rules for changing it | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Every experiment and measurement, in order | [RESEARCH.md](RESEARCH.md), pictures in [research/](research/) |
| The hunt for division, with pictures | [DIVISION.md](DIVISION.md) |
| Ideas, what is next and what is done | [IDEAS.md](IDEAS.md) |
| What changed, newest first | [CHANGELOG.md](../CHANGELOG.md) |
| The look and the lab's story | [DESIGN.md](DESIGN.md), [WORLD.md](WORLD.md) |
| The tests | `tests/` |
| The original vision and early plans | `update_notes/` |
| Every rule's numbers | `ARENA` (the Incubator) and the shader constants in `digital_life.html` |

## A few words

- **Slide:** an organism growing in the Microscope, or saved from it.
- **Specimen:** a living piece cut from a slide or kept from a dish.
- **Strain:** a placed specimen and all its descendants.
- **Body:** a connected, dense patch of one strain. **Cell:** a closed membrane holding something inside, found by the
  cell finder.
- **Set point:** the density a particle is at home in, imprinted when it was cut.
- **Broth:** the dish's food. **FED:** the Microscope biology that runs on a broth too.
