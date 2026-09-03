# World Immersion — WorldWeaver Script

**World Immersion** makes your AI Dungeon world feel alive, consistent, and vividly described — **automatically, every turn**, without manual prompting.

## 🌍 What It Does

### Five-Sense Descriptions
Fresh sensory details injected every turn:
- **Sight** — lighting, colors, movement
- **Sound** — ambient sounds, distant noises  
- **Smell** — scents in the air
- **Touch** — textures, temperature, physical sensations

Details rotate so you never see the same description twice.

### Time & Weather Tracking
- **7-phase time system** — dawn → morning → noon → afternoon → evening → night → midnight
- **6 weather types** — clear, cloudy, rainy, stormy, foggy, snowy
- Weather changes dynamically; time advances every ~4 player actions
- The AI receives full atmospheric prose so conditions actually *feel* real

### Location Detection
The script automatically detects where you are by scanning:
- Story cards
- Recent history
- Current text

If you're in a forest, you get forest sensory profiles. Unknown locations fall back to mysterious atmosphere.

### Continuity Memory
The script remembers and feeds back to the AI:
- **Recent events** — last 5 significant moments
- **Established facts** — hard truths you've set (e.g., "the bridge is broken")
- **Room objects** — items dropped or left behind
- **Inventory** — what you're carrying

This prevents characters from forgetting what just happened, where things are, or what the weather should be.

### Continuity Warnings
If the AI writes something that contradicts tracked state (bright sunlight at midnight, rain during clear skies), the script logs a warning in the console.

---

## 🚀 Installation & Setup

### Requirements
- **Inner-Self mod** — WorldWeaver runs *alongside* Inner-Self, not inside it
  - Get Inner-Self here: https://github.com/LewdLeah/Inner-Self

### How to Add to Your Scenario

1. **In your scenario's Library tab:**
   - Paste the *entire* Inner-Self Library code at the top
   - Paste the *entire* Library.js code below it
   - They won't collide — Inner-Self uses `state.memory.frontMemory`, WorldWeaver uses `state.WorldWeaver`

2. **In your Context tab:**
   - Copy the code from `Context.js`

3. **In your Input tab:**
   - Copy the code from `Input.js`

4. **In your Output tab:**
   - Copy the code from `Output.js`

---

## ⚙️ Configuration

Edit these values in Library.js to customize behavior:

```javascript
const CONFIG = {
  DETAIL_COUNT: 2,              // sensory details per turn (1-5)
  ENABLE_TIME: true,            // track time of day?
  ENABLE_WEATHER: true,         // track weather?
  ACTIONS_PER_PHASE: 4,         // actions before time advances
  WEATHER_CHANGE_CHANCE: 0.25,  // 25% chance weather changes with time
  ENABLE_CONTINUITY: true,      // check for contradictions?
  USE_FRONT_MEMORY: false,      // inject into Inner-Self's frontMemory?
  MAX_BLOCK_LENGTH: 600,        // max characters for world block
  EVENT_MEMORY: 5,              // how many events to remember
  SENSORY_MEMORY: 10            // how many sensory details to track
};
```

---

## 🗺️ Adding Custom Locations

Add location profiles to the `LOCATIONS` object in Library.js:

```javascript
const LOCATIONS = {
  forest: {
    name: "the ancient wood",
    sights: ["sunlight filtering through canopy", "moss carpeting everything"],
    sounds: ["branches groaning in wind", "distant bird cries"],
    smells: ["pine resin", "decaying leaves"],
    textures: ["bark flaking under fingers", "soft loam"],
    atmosphere: "alive with the slow pulse of ancient growth"
  },
  
  // Add your own location here:
  castle: {
    name: "the stone keep",
    sights: ["torchlight dancing on gray stone", "tapestries hanging in folds"],
    sounds: ["echo of footsteps on marble", "distant bells chiming"],
    smells: ["cold stone and metal", "old torches burning"],
    textures: ["rough hewn stone", "cold iron railings"],
    atmosphere: "steeped in ages of history and power"
  }
};
```

The script detects locations by name (case-insensitive substring matching).

---

## 🎮 What It Doesn't Do

❌ Replace Inner-Self — they're partners  
❌ Control NPCs or their thoughts (that's Inner-Self's job)  
❌ Use frontMemory, so it won't fight Inner-Self for priority  
❌ Require manual updates mid-game — it's fully automatic  

---

## 📝 How It Appears In-Game

You won't see raw script text. The AI simply starts writing richer, more atmospheric descriptions that respect time, weather, and what's already happened. The world starts *feeling* like it has memory.

---

## 📜 License

MIT License — See LICENSE file.

## 📖 Topics

`ai-dungeon` `world-building` `immersion` `roleplay` `open-source` `script` `continuity` `sensory-description`
