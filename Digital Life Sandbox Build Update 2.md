# Digital Life Sandbox: Build Update 2

This update follows the first working build and adds the next set of ideas: carrying grown structures between generations, merging saved structures, and an endosymbiosis-inspired path. It is meant to be read alongside the main project notes, and it overrides them where they conflict.

## Already Working in the Current Build

- Live tweaking from the current state: let a run develop a structure, then change settings and watch that same structure evolve under the new rules.
- Up to three organisms with adjustable parameters.
- Mutation that spawns new generations, with subtle, medium, and wild strength, plus solo and batch views.
- Sliders for the seven core parameters, the quality ladder, playback speeds, scatter and ring starts, palettes, glow, and exposure.
- Save and load of parameter configurations.

## The Remaining Gap

Live tweaking carries a structure forward within one lineage. It is not passed down when I pick a variant and create a mutation: the new generation starts from the parameters, not from the structure that grew.

Goal: when I pick a variant, the next generation inherits the grown structure, not just the recipe.

## Change 1: Mutation Inherits the Structure

- On pick, capture the full run state: trail map, every agent's position and heading, and the parameters.
- Start the next generation from that captured state and mutate only the parameters.
- Optionally mutate only a fraction of the agents, so old and new behavior share one world.
- Optionally give each agent its own inherited copy of the parameters, so differently mutated organisms can coexist and interact (the Flow-Lenia idea in the main notes).

## Change 2: Library Saves Full States

Problem: the library currently saves only a configuration of parameters, and loading it re-runs the simulation from scratch. That cannot reproduce a structure that took a long run to emerge.

Needed: let me save a specific moment of a run, once a structure has emerged.

- A saved state holds the parameters plus the full run state at that moment: trail map, agent positions and headings, and per-agent parameters if those exist.
- Keep the lightweight parameter-only save as an option, since it is small and useful for starting fresh runs.
- Add a clear "save this moment" action available during any run, and replay from the first frame should remain possible where a run's history was kept.
- Record the frame or time of the capture, and the metrics at that moment, so I can sort by them later.
- Storage note: full states are large, since they include the trail map and every agent. Store them as files in the working folder, and consider compressing the trail map or saving at reduced resolution. Agent count and map size must match when loading, or the state must be resampled.

## Change 3: Merge Saved Structures

Combine two saved full states into one world, preserving both structures.

- Pick two saved states from the library and place them in the same canvas, side by side or overlapping, with adjustable placement.
- Each structure keeps its own parameters through per-agent parameters, so the two behave differently while sharing the same trail space.
- Decide how trails interact: shared channel, separate channels per structure, or one structure's trail acting as food or poison for the other.
- Outcomes to watch for: ignoring each other, competing, absorbing one another, or settling into a stable partnership.
- Depends on Change 2, since merging needs full states and not just parameters.

## Change 4: Endosymbiosis-Inspired Mechanisms

Inspiration: the origin of mitochondria, where one cell engulfed another, the guest was not digested, and the two grew to depend on each other. This is from general knowledge, not a researched source, so treat the details as a starting point.

- Engulfment: one species' agents or trail get captured inside another's structure instead of only overlapping.
- Shared economy: each species produces something the other needs, such as one species' deposit acting as the other's food.
- Gradual dependence: an energy cost that a species can only pay while near its partner, so independence erodes over generations.
- Merge as an experiment: use Change 3 to drop two good structures together and see whether a partnership forms.
- These mechanisms need energy and food from the main notes' lifelike-mechanisms list.

## Suggested Build Order

1. Full-state capture on pick, so mutation inherits the structure (Change 1).
2. Library saves of full run states with a save-this-moment action (Change 2).
3. Per-agent inherited parameters.
4. Merge two saved states (Change 3).
5. Energy, food, and species interaction.
6. Endosymbiosis-inspired dependence (Change 4).

## Notes for Claude Code

- Treat the first build as existing. These changes extend it, so inspect the current code before changing it.
- The main project notes remain the vision document. Where they say parameter-only saves or sliders can wait, that is out of date: sliders exist, and Change 2 above supersedes the parameter-only library.
- Change one thing at a time, and keep each step testable on the RTX 4070.
