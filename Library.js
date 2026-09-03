// ═════════════════════════════════════════════════════════════════════════════
// WORLD WEAVER — Vivid World Description & Continuity Engine
// Version 1.0 | Inner Self Compatible (run alongside, not inside)
// ═════════════════════════════════════════════════════════════════════════════
//
// HOW TO ADD INNER SELF LATER:
// 1. Paste Inner Self's full Library code ABOVE this block
// 2. Leave this WorldWeaver code exactly where it is
// 3. Update your Input/Context/Output tabs to call BOTH (shown below)
//
// This script uses: state.WorldWeaver (nested, no collisions)
// It does NOT touch: state.memory.frontMemory (that's Inner Self's territory)
// ═════════════════════════════════════════════════════════════════════════════

const WorldWeaver = (function() {
  "use strict";

  // ─── CREATOR CONFIGURATION ───
  const CONFIG = {
    DETAIL_COUNT: 2,
    ENABLE_TIME: true,
    ENABLE_WEATHER: true,
    ACTIONS_PER_PHASE: 4,
    WEATHER_CHANGE_CHANCE: 0.25,
    ENABLE_CONTINUITY: true,
    USE_FRONT_MEMORY: false,
    MAX_BLOCK_LENGTH: 600,
    EVENT_MEMORY: 5,
    SENSORY_MEMORY: 10
  };

  // ─── LOCATION PROFILES ───
  const LOCATIONS = {
    __default: {
      name: "the unknown place",
      sights: [
        "faint light flickering from an unseen source",
        "shadows that seem to shift when unobserved",
        "dust motes suspended in pale shafts of illumination",
        "weathered surfaces bearing the patina of age",
        "subtle movements at the edge of vision"
      ],
      sounds: [
        "the low hum of distant machinery or wind",
        "floorboards settling with a ghostly creak",
        "silence so complete it rings in your ears",
        "the scurry of something small and hidden",
        "air moving through cracks with a breathy whisper"
      ],
      smells: [
        "old stone and dormant earth",
        "the metallic ghost of past rain",
        "dried herbs and forgotten incense",
        "stale air that hasn't moved in days",
        "wood polish and aging paper"
      ],
      textures: [
        "rough stone gritting beneath your touch",
        "smooth wood worn concave by years of use",
        "damp air clinging to your skin like a veil",
        "uneven ground threatening to twist an ankle",
        "cold metal radiating a subterranean chill"
      ],
      atmosphere: "heavy with the weight of untold stories"
    },

    forest: {
      name: "the ancient wood",
      sights: [
        "sunlight filtering through the canopy in cathedral beams",
        "moss carpeting every surface in emerald velvet",
        "fungal lanterns glowing faintly on rotting logs",
        "a deer trail winding into shadowed undergrowth",
        "leaves trembling though the air is still"
      ],
      sounds: [
        "branches groaning like old joints in the wind",
        "the distant cry of a bird you've never heard",
        "water dripping from leaf to leaf in slow percussion",
        "the snap of a twig somewhere behind you",
        "insects humming a constant, droning chord"
      ],
      smells: [
        "pine resin sharp and clean as a knife",
        "decaying leaves rich as dark chocolate",
        "the mineral breath of a nearby stream",
        "wildflowers crushed underfoot releasing perfume",
        "petrichor rising from rain-darkened earth"
      ],
      textures: [
        "bark flaking away under your fingertips",
        "soft loam giving beneath your weight",
        "nettles brushing your ankle with velvet teeth",
        "a spider's web breaking across your face like silk",
        "moss swallowing your footsteps in damp silence"
      ],
      atmosphere: "alive with the slow pulse of ancient growth"
    }
  };

  const TIME_PHASES = ["dawn", "morning", "noon", "afternoon", "evening", "night", "midnight"];
  const TIME_DESCRIPTIONS = {
    dawn: "The world holds its breath between night and day. The eastern sky bleeds from indigo to rose, and every surface glistens with dew.",
    morning: "Morning light pours golden and slanted through the world, sharpening edges and warming stone. The air tastes of new beginnings.",
    noon: "The sun rides high and merciless, bleaching colors to their bones. Shadows shrink to nothing beneath every object.",
    afternoon: "Light thickens to honey, stretching shadows long and lazy across the ground. The day's heat has settled into everything.",
    evening: "Twilight bruises the sky in violet and amber. The first stars prick through, and the air cools with the promise of night.",
    night: "Darkness wraps the world in velvet, pierced only by starlight and the occasional gleam of eyes in the black. Sounds carry farther now.",
    midnight: "The hour of deepest night—silence hangs absolute, and the world seems paused between one breath and the next."
  };

  const WEATHER_TYPES = ["clear", "cloudy", "rainy", "stormy", "foggy", "snowy"];
  const WEATHER_DESCRIPTIONS = {
    clear: "The sky is a vast, unbroken dome. Every detail stands in sharp relief, and distant objects seem close enough to touch.",
    cloudy: "Heavy clouds bruise the sky, filtering light to a muted pewter. The air feels pressurized, expectant.",
    rainy: "Rain needles down in silver threads, drumming against every surface. The air is thick with petrichor and the green smell of wet earth.",
    stormy: "Thunder rolls like cannon fire as wind lashes everything in its path. Lightning momentarily bleaches the world to monochrome.",
    foggy: "Thick fog coils through the streets and alleys, swallowing sound and reducing the world to a few meters of gray uncertainty.",
    snowy: "Snow falls in silent, fat flakes, blanketing the world in hushed white. Breath plumes in the frigid air, and every sound is muffled."
  };

  if (!state.WorldWeaver) {
    state.WorldWeaver = {
      currentLocation: null,
      timeIndex: 1,
      weather: "clear",
      turnCounter: 0,
      recentEvents: [],
      usedSensory: [],
      establishedFacts: {},
      playerInventory: [],
      locationObjects: {}
    };
  }
  const ww = state.WorldWeaver;

  function pickRandom(arr, exclude) {
    exclude = exclude || [];
    var available = arr.filter(function(item) { return exclude.indexOf(item) === -1; });
    var pool = available.length > 0 ? available : arr;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function detectLocation() {
    var locKeys = Object.keys(LOCATIONS);
    var textToSearch = "";
    var i, k, card, name, keys, entry;

    if (typeof storyCards !== "undefined" && storyCards && storyCards.length) {
      for (i = 0; i < storyCards.length; i++) {
        card = storyCards[i];
        name = (card.name || "").toLowerCase();
        keys = (card.keys || "").toLowerCase();
        entry = (card.entry || "").toLowerCase();
        textToSearch = name + " " + keys + " " + entry;
        for (k = 0; k < locKeys.length; k++) {
          if (locKeys[k] === "__default") continue;
          if (textToSearch.indexOf(locKeys[k]) !== -1) return locKeys[k];
        }
      }
    }

    if (typeof history !== "undefined" && history && history.length) {
      var recent = history.slice(-3);
      textToSearch = "";
      for (i = 0; i < recent.length; i++) {
        textToSearch += " " + (recent[i].text || "").toLowerCase();
      }
      for (k = 0; k < locKeys.length; k++) {
        if (locKeys[k] === "__default") continue;
        if (textToSearch.indexOf(locKeys[k]) !== -1) return locKeys[k];
      }
    }

    var cur = (typeof text !== "undefined" ? text : "").toLowerCase();
    for (k = 0; k < locKeys.length; k++) {
      if (locKeys[k] === "__default") continue;
      if (cur.indexOf(locKeys[k]) !== -1) return locKeys[k];
    }

    return ww.currentLocation || "__default";
  }

  function getSensoryBlock(locationKey, count) {
    var profile = LOCATIONS[locationKey] || LOCATIONS.__default;
    var pool = [];
    var i;

    if (profile.sights)   { for (i = 0; i < profile.sights.length;   i++) pool.push({ type: "Sight",  text: profile.sights[i]   }); }
    if (profile.sounds)   { for (i = 0; i < profile.sounds.length;   i++) pool.push({ type: "Sound",  text: profile.sounds[i]   }); }
    if (profile.smells)   { for (i = 0; i < profile.smells.length;   i++) pool.push({ type: "Smell",  text: profile.smells[i]   }); }
    if (profile.textures) { for (i = 0; i < profile.textures.length; i++) pool.push({ type: "Touch",  text: profile.textures[i] }); }

    var available = pool.filter(function(item) {
      return ww.usedSensory.indexOf(item.text) === -1;
    });
    var usePool = available.length >= count ? available : pool;
    var selected = shuffle(usePool).slice(0, count);

    for (i = 0; i < selected.length; i++) {
      ww.usedSensory.push(selected[i].text);
    }
    if (ww.usedSensory.length > CONFIG.SENSORY_MEMORY) {
      ww.usedSensory = ww.usedSensory.slice(-CONFIG.SENSORY_MEMORY);
    }

    if (selected.length === 0) return "";

    var starters = {
      Sight: ["You notice", "Your eyes catch", "You see"],
      Sound: ["You hear", "Your ears pick up", "The air carries"],
      Smell: ["You catch the scent of", "The air smells of", "Your nose detects"],
      Touch: ["You feel", "Your skin senses", "The air feels"]
    };

    var fragments = [];
    for (i = 0; i < selected.length; i++) {
      var s = pickRandom(starters[selected[i].type] || ["You perceive"]);
      fragments.push(s + " " + selected[i].text);
    }
    return fragments.join(". ") + ".";
  }

  function advanceWorld() {
    ww.turnCounter++;
    if (CONFIG.ENABLE_TIME && ww.turnCounter % CONFIG.ACTIONS_PER_PHASE === 0) {
      ww.timeIndex = (ww.timeIndex + 1) % TIME_PHASES.length;
      log("WorldWeaver: Time → " + TIME_PHASES[ww.timeIndex]);
      if (CONFIG.ENABLE_WEATHER && Math.random() < CONFIG.WEATHER_CHANGE_CHANCE) {
        var old = ww.weather;
        ww.weather = pickRandom(WEATHER_TYPES, [old]);
        log("WorldWeaver: Weather → " + ww.weather + " (was " + old + ")");
      }
    }
  }

  function getTimeBlock() {
    if (!CONFIG.ENABLE_TIME) return "";
    return TIME_DESCRIPTIONS[TIME_PHASES[ww.timeIndex]] || "";
  }

  function getWeatherBlock() {
    if (!CONFIG.ENABLE_WEATHER) return "";
    return WEATHER_DESCRIPTIONS[ww.weather] || "";
  }

  function recordEvent(outputText) {
    if (!outputText || outputText.length < 20) return;
    var summary = (outputText.split(/[.!?]/)[0] || outputText).trim();
    if (summary.length > 120) summary = summary.slice(0, 120) + "...";
    if (summary && ww.recentEvents.indexOf(summary) === -1) {
      ww.recentEvents.push(summary);
      if (ww.recentEvents.length > CONFIG.EVENT_MEMORY) ww.recentEvents.shift();
    }
  }

  function getContinuityBlock() {
    var parts = [];
    if (ww.recentEvents.length > 0) {
      parts.push("Recent events: " + ww.recentEvents.join("; ") + ".");
    }
    var facts = Object.keys(ww.establishedFacts);
    if (facts.length > 0) {
      var fstr = facts.map(function(k) { return k + "=" + ww.establishedFacts[k]; }).join("; ");
      parts.push("Facts: " + fstr + ".");
    }
    var locObjs = ww.locationObjects[ww.currentLocation];
    if (locObjs && Object.keys(locObjs).length > 0) {
      var ostr = Object.keys(locObjs).map(function(k) { return k + " (" + locObjs[k] + ")"; }).join(", ");
      parts.push("Objects here: " + ostr + ".");
    }
    if (ww.playerInventory.length > 0) {
      parts.push("Carrying: " + ww.playerInventory.join(", ") + ".");
    }
    return parts.join(" ");
  }

  function checkContinuity(outputText) {
    if (!CONFIG.ENABLE_CONTINUITY || !outputText) return;
    var lower = outputText.toLowerCase();
    var phase = TIME_PHASES[ww.timeIndex] || "";
    var nightPhases = ["evening", "night", "midnight"];
    if (nightPhases.indexOf(phase) !== -1) {
      if (lower.indexOf("bright sunlight") !== -1 || lower.indexOf("sunshine") !== -1) {
        log("WorldWeaver CONTINUITY: daylight mentioned during " + phase);
      }
    }
    if (ww.weather === "clear" && lower.indexOf("rain") !== -1 && lower.indexOf("no rain") === -1) {
      log("WorldWeaver CONTINUITY: rain mentioned during clear weather");
    }
  }

  function parseInput(inputText) {
    if (!inputText) return;
    var lower = inputText.toLowerCase();
    var m;

    m = lower.match(/(?:pick up|take|grab|collect)\s+(?:the\s+)?([a-z\s]+?)(?:\.|,| from |$)/i);
    if (m) {
      var item = m[1].trim();
      if (ww.playerInventory.indexOf(item) === -1) {
        ww.playerInventory.push(item);
        if (ww.locationObjects[ww.currentLocation]) delete ww.locationObjects[ww.currentLocation][item];
        log("WorldWeaver: +inventory " + item);
      }
    }

    m = lower.match(/(?:drop|put down|discard|leave)\s+(?:the\s+)?([a-z\s]+?)(?:\.|,|$)/i);
    if (m) {
      item = m[1].trim();
      var idx = ww.playerInventory.indexOf(item);
      if (idx !== -1) {
        ww.playerInventory.splice(idx, 1);
        if (!ww.locationObjects[ww.currentLocation]) ww.locationObjects[ww.currentLocation] = {};
        ww.locationObjects[ww.currentLocation][item] = "on the ground";
        log("WorldWeaver: -inventory " + item + " @ " + ww.currentLocation);
      }
    }
  }

  function onInput(inputText) {
    parseInput(inputText);
    return inputText;
  }

  function onContext(contextText) {
    var detected = detectLocation();
    if (detected && detected !== ww.currentLocation) {
      log("WorldWeaver: Location → " + detected);
      ww.currentLocation = detected;
    }
    advanceWorld();

    var blocks = [];
    var t = getTimeBlock();    if (t) blocks.push(t);
    var w = getWeatherBlock(); if (w) blocks.push(w);
    var s = getSensoryBlock(ww.currentLocation || "__default", CONFIG.DETAIL_COUNT);
    if (s) blocks.push(s);
    var c = getContinuityBlock(); if (c) blocks.push(c);
    var profile = LOCATIONS[ww.currentLocation] || LOCATIONS.__default;
    if (profile.atmosphere) blocks.push("The atmosphere is " + profile.atmosphere + ".");

    if (blocks.length === 0) return contextText;

    var worldBlock = blocks.join("\n\n");
    if (worldBlock.length > CONFIG.MAX_BLOCK_LENGTH) {
      worldBlock = worldBlock.slice(0, CONFIG.MAX_BLOCK_LENGTH) + "...";
    }

    if (CONFIG.USE_FRONT_MEMORY) {
      var existing = state.memory.frontMemory || "";
      var tag = "\n\n[World State]\n" + worldBlock + "\n[/World State]";
      state.memory.frontMemory = existing ? existing + tag : tag;
    } else {
      var injection = "\n\n[World State — Atmosphere & Continuity]\n" + worldBlock + "\n[End World State]\n";
      contextText = contextText + injection;
    }
    return contextText;
  }

  function onOutput(outputText) {
    recordEvent(outputText);
    checkContinuity(outputText);
    return outputText;
  }

  return function(hook) {
    try {
      if (hook === "input") {
        text = onInput(text);
      } else if (hook === "context") {
        text = onContext(text);
      } else if (hook === "output") {
        text = onOutput(text);
      }
    } catch (err) {
      log("WorldWeaver ERROR: " + (err.message || err));
    }
  };
})();
