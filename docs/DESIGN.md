# Design System

The app should feel like operating a piece of lab hardware in a dark room, with living light leaking out of it. Read [WORLD.md](WORLD.md) for the story this design serves.

## The idea: instrument and organism

Two languages meet on purpose:

| The instrument | The organism |
|---|---|
| Dot-matrix type, square grids, numbered menus | Soft light that spreads and fades |
| Exact, still, mechanical | Alive, drifting, decaying |
| Inspired by Teenage Engineering hardware and Nothing's dot-matrix lettering | Taken from the simulation itself |

Neither should take over. Type and structure come from the instrument. Edges, highlights and feedback come from the organism.

## Typography

- **Lumen Dot** is the app's dot-matrix face. It is drawn from the same 5×7 font as the status display, as rows of round dots. It is used for room names, section titles, menu items, pad labels, slide labels and Incubator readouts. It is uppercase only.
- **Mono** is the system monospace. It is used for row labels, values, help text and anything long.
- Dot-matrix text never runs longer than a short label. Sentences stay in Mono.
- Numbers use tabular figures, so readouts don't jitter.

No outside font files are used. The page stays one self-contained file.

## Color

| Token | Value | Use |
|---|---|---|
| Room | `#05090b` | The dark lab around the instrument |
| Chassis | `#0e171a` | The instrument's body: dark anodized metal |
| Ink | `#cfe9e2` | Text on the chassis |
| Teal | `#17807f` | Primary keys (MUTATE, RANDOM, BREED) are lit teal |
| Deep | `#153f6e` | SAVE and the main dialog button are lit blue |
| Lumen | `#6ff0cf` | Light from the organisms: trails, glows, active edges |
| Signal | `#ff6a3d` | Recording and warnings, used rarely |
| Rainbow | Hue cycle | Status icons flashing on events, as on the EP-133 display |

## Motion: afterglow, not movement

The simulation is the only thing that moves. The instrument answers with light that fades, the way trails do, but nothing travels across the screen.

- **Hover:** the edge of a control brightens a little and the label lights up. It is a soft change, not an animation.
- **Press:** the control flashes with lumen around its edge and inside, then fades over about a second, like a phosphor afterglow.
- **Selection:** the chosen switch position and menu page stay lit.
- **Rooms:** changing rooms makes the edge of the stage glow once and fade.
- **Display icons** flash in color when something happens. They are small, short and only answer events.

An earlier version sent motes of light crawling around the edges of controls and of the stage. It looked alive but pulled the eye away from the organisms, so it was replaced by the afterglow. With reduced motion turned on in the system, the afterglow is shorter and the stage glow is off.

## Rooms

| Room | View | Frame | Mood |
|---|---|---|---|
| Microscope | SOLO and BATCH | A glass slide with corner brackets, scale bar and label. BATCH is a tray of nine slides, each with its own brackets and frosted SLIDE label | Clinical, bright, focused |
| Incubator | Arena | A round porthole in dark machinery with readouts around the rim | Warm, alive, slightly dangerous |
| Archive | Library | Drawers of photographs, the family chart, specimen files | Quiet, cold, orderly |

Rooms are chosen from the room bar at the top of the screen. Each room shows only the controls it needs.

## Components

- **Console:** the control panel is dark anodized metal, the same world as the rooms. Sections are separated by engraved lines. Screens and switch wells are recessed into it.
- **Room bar:** large Lumen Dot room names with a pixel icon each. The current room glows.
- **Menu:** the instrument pages (ORGANISM, LIFE, FIELD and so on) are a numbered menu, `01 ORGANISM`, on their own small screen. The chosen page is lit, with a lumen bar under it.
- **Keys:** dark caps with Lumen Dot labels lit from inside: teal for the main actions, blue for SAVE, pale for the rest. A long label shrinks to fit its key.
- **Switches:** a recessed well. The chosen position lights up in lumen.
- **Sliders:** a dark slot with a lit fill, and a cap with a light line down its middle.
- **Display:** the dot-matrix status screen with a row of pixel icons along its bottom. Icons light when their state is on and flash through rainbow colors when something happens.
- **Slide label:** frosted glass strip with the slide number and name.
- **Incubator rim:** a bezel with tick marks, and readouts for population, broth, strains and step down its left side.
- **Specimen deck:** a card file standing to the right of the dish. The card in front is full size and the rest stand behind it above and below, smaller and tilted back, with a gap between each. Scrolling flips one card per notch. The cards move only while you scroll, and only briefly, so the rule below still holds.
- **History display:** the Incubator's chart is an LED bar display. Each column of dots is a moment, stacked in each strain's color, and unlit dots stay faintly visible.
- **Strain highlight:** the dish rests calmly, with a soft bloom. Pointing at a strain in the list lifts its trails to full glow and dims the others, and its dots stay bright on the history display. Moving away returns the dish to rest.

## Pixel icons

Icons are 7×7 dots, drawn like the display font.

| Icon | Meaning | Flashes when |
|---|---|---|
| Play | Running | Started or resumed |
| Chip | GPU | The app starts on the graphics card |
| Disk | Save | A save finishes |
| Helix | Breeding | A new generation is bred |
| Spark | Mutation | Rules mutate |
| Dish | Incubator | A specimen is placed or kept |
| Book | Archive | The Library opens |
| Dot | Recording | A clip or recording is running |
| Folder | Folder access | Access must be allowed |
| Alert | Problem | Something failed |

## Rules for new work

1. A new control borrows its type from the instrument and its feedback from the organism.
2. Light must fade. Nothing glows forever unless something keeps renewing it.
3. Only the simulation moves. Feedback is light that fades in place.
4. Prefer the lab vocabulary in [WORLD.md](WORLD.md) when a label is being written anyway.
5. Keep everything in the one HTML file, with no outside fonts or images.
