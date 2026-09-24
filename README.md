# World Immersion 2.9

World Immersion is a lightweight AI Dungeon saved-script add-on that keeps the physical world present without overpowering the story. It provides subtle rotating sensory cues, compact continuity support, and gradual time progression while leaving generated story text and player agency intact.

It works as a standalone script and can also run after a manually installed copy of [Inner Self](https://github.com/LewdLeah/Inner-Self).

## What it does

### Subtle sensory rotation

Every second newly observed context generation, World Immersion offers one short, conditional cue:

**Sight → Sound → Scent → Touch → repeat**

The cue may draw from an established person, interaction, object, or location. This allows details such as appearance, expression, voice, clothing, nearby scent, texture, temperature, pressure, or physical warmth when the current scene supports them.

The AI creates the detail from the active story. World Immersion does not use a fixed description bank and does not request a separate descriptive paragraph. Quiet turns receive no World Immersion prompt at all.

### Scene continuity

Sensory turns include a compact reminder to continue directly and preserve established scene facts. This encourages consistent people, surroundings, objects, positions, conditions, and recent changes while still allowing actions and events to alter them naturally.

This is guidance rather than a separate fact database. Important canon still belongs in Plot Essentials and Story Cards.

### Gradual time progression

Time starts unknown. An unquoted standalone Story sentence such as `It is morning.` establishes the clock.

Each phase lasts 20 subsequent input actions:

**Dawn → Morning → Noon → Afternoon → Evening → Night → Midnight → Dawn**

World Immersion mentions time only when its tentative phase changes. Explicit Story timing overrides the clock and resets its count. Questions, quoted dialogue, past-tense statements, and ordinary mentions do not establish time.

The parser is deliberately conservative. It does not attempt to infer every sleep, journey, or time skip; state the resulting phase in Story mode when an exact override is needed.

### Flow and repetition protection

- Adds nothing on non-cue turns.
- Uses one compact sensory instruction instead of a checklist.
- Does not replay opening prose or store generated descriptions for reinjection.
- Never removes received story context to make room for optional guidance.
- Retries with the same action identifier do not advance rotation or time.
- Undo is supported with bounded recent checkpoints.
- Identifiable leaked World Immersion guidance is removed from output.

## Installation

Add World Immersion as its own saved script and copy each file into the matching tab:

- `Library.js` → Library
- `Input.js` → Input
- `Context.js` → Context
- `Output.js` → Output

Save the script and select that version for the scenario. Keep only one World Immersion instance active.

### With Inner Self

1. Install Inner Self manually in the scenario.
2. Add World Immersion as a separate saved script beneath Inner Self in the run order.
3. Leave Inner Self's four tabs unchanged.

Inner Self and World Immersion use separate state namespaces. World Immersion does not call Inner Self or write to its thoughts, cards, memory, Author's Note, or front memory.

Turn **Optimized Context off** when using the published Inner Self version. AI Dungeon notes that Optimized Context disables some scripting features, and Inner Self does not currently guarantee compatibility with it.

## Configuration

The main settings are at the top of `Library.js`:

```javascript
var WW_CONFIG = {
  ACTIONS_PER_PHASE: 20,
  AUTO_ADVANCE_TIME: true,
  INITIAL_TIME: null,
  MAX_BLOCK_LENGTH: 360,
  DEBUG: false
};
```

`INITIAL_TIME: null` keeps time unknown until the story establishes it.

## Boundaries

World Immersion does not:

- control player actions, dialogue, thoughts, or feelings;
- manage NPC thoughts or replace Inner Self;
- force weather, locations, discoveries, threats, or events;
- guess inventory or reconstruct a database of scene facts;
- overwrite Story Cards, Plot Essentials, Author's Note, memory, or front memory;
- guarantee that every AI model will obey every optional cue.

## Testing

Run the regression suite with Node:

```bash
node test.cjs
```

The self-contained suite covers the 20-action clock, explicit time overrides, two-action sensory rotation, untouched quiet turns, retry, undo, context-budget handling, guidance-leak cleanup, and long-run state bounds. When the development-only Inner Self fixture is present, it also runs the integration check; its absence does not prevent the public standalone suite from running.

These deterministic tests verify script mechanics. Narrative quality still requires live AI Dungeon playtesting because models and settings respond differently.

## References

- [AI Dungeon scripting documentation](https://help.aidungeon.com/scripting)
- [Inner Self](https://github.com/LewdLeah/Inner-Self)

## License

MIT License — see `LICENSE`.
