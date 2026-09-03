# SETUP GUIDE — World Immersion (WorldWeaver)

## Quick Start

### Step 1: Get Inner-Self First
WorldWeaver is designed to run **alongside** Inner-Self, not replace it.

- Clone or download Inner-Self: https://github.com/LewdLeah/Inner-Self
- Read Inner-Self's setup guide

### Step 2: Copy Code to Your Scenario

**Library Tab:**
1. Paste the **entire Inner-Self Library code** at the top
2. Paste the **entire WorldWeaver (Library.js) code** below it
3. They won't interfere — they use separate state objects

**Context Tab:**
- Copy the code from `Context.js` in this repo

**Input Tab:**
- Copy the code from `Input.js` in this repo

**Output Tab:**
- Copy the code from `Output.js` in this repo

### Step 3: Test

Generate a response. You should see:
- ✅ Rich sensory descriptions (sight, sound, smell, touch)
- ✅ Time and weather descriptions
- ✅ Consistency tracking in the script console
- ✅ No conflicts with Inner-Self (they share no state)

---

## Configuration

Open `Library.js` and edit the `CONFIG` object at the top:

```javascript
const CONFIG = {
  DETAIL_COUNT: 2,              // 1-5 sensory details per turn
  ENABLE_TIME: true,            // track time of day?
  ENABLE_WEATHER: true,         // track weather?
  ACTIONS_PER_PHASE: 4,         // actions before time advances
  WEATHER_CHANGE_CHANCE: 0.25,  // 0-1 (25% chance weather changes)
  ENABLE_CONTINUITY: true,      // check for contradictions?
  USE_FRONT_MEMORY: false,      // inject into Inner-Self's frontMemory?
  MAX_BLOCK_LENGTH: 600,        // max characters for world description
  EVENT_MEMORY: 5,              // how many events to remember
  SENSORY_MEMORY: 10            // unique sensory details to rotate
};
```

---

## Adding Custom Locations

Open `Library.js` and find the `LOCATIONS` object. Add a new location:

```javascript
const LOCATIONS = {
  // ... existing locations ...
  
  seaside: {
    name: "the windswept shore",
    sights: [
      "waves crashing against weathered rocks",
      "seabirds wheeling overhead in endless spirals",
      "spray catching light like liquid diamonds"
    ],
    sounds: [
      "the eternal roar of the tide",
      "gulls crying out in raucous chorus",
      "the crunch of shells underfoot"
    ],
    smells: [
      "salt thick on the air",
      "brine and seaweed",
      "the clean mineral scent of the sea"
    ],
    textures: [
      "sand slipping between your toes",
      "smooth pebbles worn by centuries of waves",
      "sea spray cool and stinging on your skin"
    ],
    atmosphere: "wild and untamed, ancient as memory"
  }
};
```

**Location matching is case-insensitive and substring-based:**
- Write "I go to the **sea**side" → matches `seaside` location
- Write "I enter the **forest**" → matches `forest` location
- Unknown locations → fall back to `__default` (mysterious)

---

## How Continuity Works

WorldWeaver tracks:
- **Recent events** (last 5 turns) — prevents character amnesia
- **Established facts** — manually set permanent truths
- **Room objects** — items you drop/leave behind
- **Player inventory** — what you're carrying

If the AI writes something contradictory:
- Daylight during midnight? → Warning logged
- Rain during clear weather? → Warning logged
- Check the script console to catch these

---

## Troubleshooting

### "WorldWeaver is undefined"
- Make sure you pasted the **entire Library.js code** into your Library tab
- Check for copy-paste errors (missing closing braces)

### "Conflicts with Inner-Self"
- WorldWeaver uses `state.WorldWeaver` (isolated)
- Inner-Self uses `state.memory.frontMemory` (isolated)
- They should never collide if both are installed correctly

### Sensory descriptions aren't appearing
- Check `CONFIG.DETAIL_COUNT` — set to 0-1 to debug
- Check `CONFIG.ENABLE_TIME` and `CONFIG.ENABLE_WEATHER`
- Open the script console (`Ctrl+Shift+I` or browser dev tools) and look for `WorldWeaver:` logs

### Time or weather not advancing
- Check `CONFIG.ACTIONS_PER_PHASE` — time advances every N actions
- Default is 4 actions per phase
- Lower this number if you want faster time progression

---

## Tips for Best Results

1. **Pair with Inner-Self** — WorldWeaver handles world, Inner-Self handles characters
2. **Use descriptive location names** — the script matches via keyword detection
3. **Set established facts manually** in the game state if important
4. **Check the console** — WorldWeaver logs all major state changes
5. **Customize locations** — add regions from your world to make it feel more alive

---

## Support

For issues or suggestions, check the main README or the GitHub repository:
https://github.com/QueenMavis/World-Immersion
