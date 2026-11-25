# Digital Life Sandbox: Notes 3

New ideas after reading the repo, including the Arena. Read alongside the README and the research notes.

## Organism Library: Turn a Saved Slime Mold Into an Organism

**Idea.** The Library holds every slime mold simulation I have saved. Add an option to take any one of those saves and turn it into an organism, which then goes into its own organism library.

**How it should work**

- In the Library, choose a saved slime mold and pick an action such as MAKE ORGANISM.
- The app opens that save's living state and shows the body it would cut out, with a preview outline, before anything is committed.
- I can accept the cut, adjust it (move, resize, or pick a different candidate), or cancel.
- The result is saved as an organism in a separate organism library, with its own name, tags, and a picture.
- The original slime mold save is never changed.
- Organisms from this library are what the Arena uses as founders.

**Why this is a good idea**

- Today a specimen is cut from whatever is currently running, so I have to regrow or reopen a save first and then promote it.
- A dedicated organism library lets me build a collection of bodies over time, and choose among them for the Arena.
- It keeps the two kinds of things clear: slime mold simulations are experiments, organisms are the parts I build worlds from.

**Open questions**

- Whether organisms live in the same Library with a filter, or in a separate page.
- Whether one save can produce several organisms, for example one per detected body.
- Whether to keep a link from each organism back to the save it came from, for the family tree.

## Smarter Body Detection

**Current behavior (from the code).** The cut does not detect a body. It builds a coarse particle-count grid, slides a fixed-radius circle over it with a slight bias toward the center, and takes the spot with the most particles. Everything in that circle becomes the specimen. So a body is really the densest disc, and nothing checks that it holds a coherent structure. Real bodies can be sliced through, and a dense blob of plain trail qualifies as well as a ring or cell.

**Proposed approach**

1. Threshold the particle density grid and group touching cells into connected components. Each component is a candidate body.
2. Score each candidate using measures the LIFE score already has: whether it stands apart from its surroundings, has a boundary, contains loops or a ring, and its size.
3. Pick the best scorer, or highlight a few candidates and let me choose.
4. Cut to the component's own outline, expanded slightly, so the specimen is the exact body plus a margin of trail.

**Refinements**

- If a body is larger than the arena's size limit, shrink it uniformly instead of slicing it.
- Show the detected outline before committing.
- Keep the existing disc cut as an option.

**Tradeoff.** The Arena assumes round specimens. A shaped cut means changing how stamping and the radius work. A first step is to keep the disc but center and size it on the best-scored component.

**Pairs with the organism library.** The preview step in MAKE ORGANISM is where the detected candidates and outline would be shown.

## Random Starting Structure

**Concern.** The current starts are scatter, ring in, ring out, and blank. Starting conditions act like a seed shape, and slime tends to remember them. Scatter tends toward uniform, symmetric-looking networks, and rings force a radial structure. That may limit which structures can form.

**Idea.** Add one new START option that randomly picks from a small set of starting structures each time. It sits alongside blank, scatter, ring in, and ring out, so the controls stay simple.

**Candidate structures to pick from**

- Several clusters at random spots.
- A swirl, with agents starting with headings that rotate around a center.
- Two groups side by side.
- Room to add one or two more later, such as stripes or a density gradient.

**Details to decide when building**

- Each pick is seeded, so a seed plus settings still reproduces the exact run, as the README's determinism rule requires.
- Record which structure was picked in the save, so a replay or recipe save starts the same way.
- Randomize the details within each structure, such as cluster count, positions, swirl direction, and group spacing.
- Works with multiple species: spread species across the structures or give each its own.

**Note.** Barriers, the reaction field, and multiple species also break symmetry, so starting conditions are only one of the limits on structural variety.
