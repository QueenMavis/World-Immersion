// ═════════════════════════════════════════════════════════════════════════════
// WORLD WEAVER — Self-Healing Edition
// Compatible with Inner Self (add via AI Dungeon script library)
// ═════════════════════════════════════════════════════════════════════════════

log("WW: Loading library...");

// ─── CONFIG ───
var WW_CONFIG = {
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

// ─── LOCATION DATA ───
var WW_LOCATIONS = {
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

// ─── TIME & WEATHER ───
var WW_TIME_PHASES = ["dawn", "morning", "noon", "afternoon", "evening", "night", "midnight"];
var WW_TIME_DESC = {
  dawn: "The world holds its breath between night and day. The eastern sky bleeds from indigo to rose, and every surface glistens with dew.",
  morning: "Morning light pours golden and slanted through the world, sharpening edges and warming stone. The air tastes of new beginnings.",
  noon: "The sun rides high and merciless, bleaching colors to their bones. Shadows shrink to nothing beneath every object.",
  afternoon: "Light thickens to honey, stretching shadows long and lazy across the ground. The day's heat has settled into everything.",
  evening: "Twilight bruises the sky in violet and amber. The first stars prick through, and the air cools with the promise of night.",
  night: "Darkness wraps the world in velvet, pierced only by starlight and the occasional gleam of eyes in the black. Sounds carry farther now.",
  midnight: "The hour of deepest night—silence hangs absolute, and the world seems paused between one breath and the next."
};
var WW_WEATHER_TYPES = ["clear", "cloudy", "rainy", "stormy", "foggy", "snowy"];
var WW_WEATHER_DESC = {
  clear: "The sky is a vast, unbroken dome. Every detail stands in sharp relief, and distant objects seem close enough to touch.",
  cloudy: "Heavy clouds bruise the sky, filtering light to a muted pewter. The air feels pressurized, expectant.",
  rainy: "Rain needles down in silver threads, drumming against every surface. The air is thick with petrichor and the green smell of wet earth.",
  stormy: "Thunder rolls like cannon fire as wind lashes everything in its path. Lightning momentarily bleaches the world to monochrome.",
  foggy: "Thick fog coils through the streets and alleys, swallowing sound and reducing the world to a few meters of gray uncertainty.",
  snowy: "Snow falls in silent, fat flakes, blanketing the world in hushed white. Breath plumes in the frigid air, and every sound is muffled."
};

// ─── STATE REPAIR (runs every turn) ───
function wwFixState() {
  if (typeof state === "undefined") {
    log("WW CRITICAL: 'state' object missing. Cannot persist data.");
    return false;
  }

  var defaults = {
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

  if (!state.WorldWeaver) {
    state.WorldWeaver = {};
    log("WW: Created fresh state");
  }

  var ww = state.WorldWeaver;

  for (var key in defaults) {
    if (!defaults.hasOwnProperty(key)) continue;
    var expected = defaults[key];
    var actual = ww[key];
    var typeExpected = typeof expected;
    var typeActual = typeof actual;

    if (typeActual === "undefined") {
      ww[key] = expected;
      log("WW: Repaired missing '" + key + "'");
    } else if (typeExpected === "object" && expected !== null && actual === null) {
      ww[key] = expected;
      log("WW: Repaired null '" + key + "'");
    } else if (typeExpected === "object" && expected !== null && Object.prototype.toString.call(expected) === "[object Array]" && Object.prototype.toString.call(actual) !== "[object Array]") {
      ww[key] = expected;
      log("WW: Repaired corrupted array '" + key + "'");
    } else if (typeExpected === "object" && expected !== null && Object.prototype.toString.call(expected) !== "[object Array]" && Object.prototype.toString.call(actual) !== "[object Object]") {
      ww[key] = expected;
      log("WW: Repaired corrupted object '" + key + "'");
    }
  }

  return true;
}

// ─── HELPERS ───
function wwPickRandom(arr, exclude) {
  exclude = exclude || [];
  var pool = [];
  for (var i = 0; i < arr.length; i++) {
    if (exclude.indexOf(arr[i]) === -1) pool.push(arr[i]);
  }
  if (pool.length === 0) pool = arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

function wwShuffle(arr) {
  var copy = [];
  for (var i = 0; i < arr.length; i++) copy.push(arr[i]);
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function wwSafeString(val) {
  if (typeof val === "string") return val;
  if (val === null || typeof val === "undefined") return "";
  return String(val);
}

function wwSafeLower(val) {
  return wwSafeString(val).toLowerCase();
}

// ─── LOCATION DETECTION ───
function wwDetectLocation() {
  var locKeys = [];
  for (var k in WW_LOCATIONS) {
    if (WW_LOCATIONS.hasOwnProperty(k) && k !== "__default") locKeys.push(k);
  }

  var textToSearch = "";
  var i, k;

  if (typeof storyCards !== "undefined" && storyCards && storyCards.length) {
    for (i = 0; i < storyCards.length; i++) {
      var card = storyCards[i];
      if (!card || typeof card !== "object") continue;
      var name = wwSafeLower(card.name);
      var keys = wwSafeLower(card.keys);
      var entry = wwSafeLower(card.entry);
      textToSearch = name + " " + keys + " " + entry;
      for (k = 0; k < locKeys.length; k++) {
        if (textToSearch.indexOf(locKeys[k]) !== -1) return locKeys[k];
      }
    }
  }

  if (typeof history !== "undefined" && history && history.length) {
    var recent = [];
    var start = Math.max(0, history.length - 3);
    for (i = start; i < history.length; i++) {
      if (history[i] && typeof history[i].text !== "undefined") {
        recent.push(history[i]);
      }
    }
    textToSearch = "";
    for (i = 0; i < recent.length; i++) {
      textToSearch += " " + wwSafeLower(recent[i].text);
    }
    for (k = 0; k < locKeys.length; k++) {
      if (textToSearch.indexOf(locKeys[k]) !== -1) return locKeys[k];
    }
  }

  var cur = wwSafeLower(text);
  for (k = 0; k < locKeys.length; k++) {
    if (cur.indexOf(locKeys[k]) !== -1) return locKeys[k];
  }

  if (state.WorldWeaver && state.WorldWeaver.currentLocation) {
    return state.WorldWeaver.currentLocation;
  }
  return "__default";
}

// ─── SENSORY ENGINE ───
function wwGetSensoryBlock(locationKey, count) {
  var profile = WW_LOCATIONS[locationKey] || WW_LOCATIONS.__default;
  var pool = [];
  var i;

  if (profile.sights)   { for (i = 0; i < profile.sights.length;   i++) pool.push({ type: "Sight",  text: profile.sights[i]   }); }
  if (profile.sounds)   { for (i = 0; i < profile.sounds.length;   i++) pool.push({ type: "Sound",  text: profile.sounds[i]   }); }
  if (profile.smells)   { for (i = 0; i < profile.smells.length;   i++) pool.push({ type: "Smell",  text: profile.smells[i]   }); }
  if (profile.textures) { for (i = 0; i < profile.textures.length; i++) pool.push({ type: "Touch",  text: profile.textures[i] }); }

  var ww = state.WorldWeaver;
  var available = [];
  for (i = 0; i < pool.length; i++) {
    if (ww.usedSensory.indexOf(pool[i].text) === -1) available.push(pool[i]);
  }
  var usePool = available.length >= count ? available : pool;
  var shuffled = wwShuffle(usePool);
  var selected = [];
  for (i = 0; i < count && i < shuffled.length; i++) selected.push(shuffled[i]);

  for (i = 0; i < selected.length; i++) {
    ww.usedSensory.push(selected[i].text);
  }
  if (ww.usedSensory.length > WW_CONFIG.SENSORY_MEMORY) {
    ww.usedSensory = ww.usedSensory.slice(ww.usedSensory.length - WW_CONFIG.SENSORY_MEMORY);
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
    var s = wwPickRandom(starters[selected[i].type] || ["You perceive"]);
    fragments.push(s + " " + selected[i].text);
  }
  return fragments.join(". ") + ".";
}

// ─── TIME & WEATHER ───
function wwAdvanceWorld() {
  var ww = state.WorldWeaver;
  ww.turnCounter++;
  if (WW_CONFIG.ENABLE_TIME && ww.turnCounter % WW_CONFIG.ACTIONS_PER_PHASE === 0) {
    ww.timeIndex = (ww.timeIndex + 1) % WW_TIME_PHASES.length;
    log("WW: Time is now " + WW_TIME_PHASES[ww.timeIndex]);
    if (WW_CONFIG.ENABLE_WEATHER && Math.random() < WW_CONFIG.WEATHER_CHANGE_CHANCE) {
      var old = ww.weather;
      ww.weather = wwPickRandom(WW_WEATHER_TYPES, [old]);
      log("WW: Weather changed to " + ww.weather + " (was " + old + ")");
    }
  }
}

function wwGetTimeBlock() {
  if (!WW_CONFIG.ENABLE_TIME) return "";
  return WW_TIME_DESC[WW_TIME_PHASES[state.WorldWeaver.timeIndex]] || "";
}

function wwGetWeatherBlock() {
  if (!WW_CONFIG.ENABLE_WEATHER) return "";
  return WW_WEATHER_DESC[state.WorldWeaver.weather] || "";
}

// ─── CONTINUITY ───
function wwRecordEvent(outputText) {
  if (typeof outputText !== "string" || outputText.length < 20) return;
  var parts = outputText.split(/[.!?]/);
  var summary = wwSafeString(parts[0]).trim();
  if (summary.length > 120) summary = summary.substring(0, 120) + "...";
  var ww = state.WorldWeaver;
  if (summary && ww.recentEvents.indexOf(summary) === -1) {
    ww.recentEvents.push(summary);
    if (ww.recentEvents.length > WW_CONFIG.EVENT_MEMORY) ww.recentEvents.shift();
  }
}

function wwGetContinuityBlock() {
  var ww = state.WorldWeaver;
  var parts = [];
  if (ww.recentEvents.length > 0) {
    parts.push("Recent events: " + ww.recentEvents.join("; ") + ".");
  }
  var facts = [];
  for (var k in ww.establishedFacts) {
    if (ww.establishedFacts.hasOwnProperty(k)) facts.push(k + "=" + ww.establishedFacts[k]);
  }
  if (facts.length > 0) parts.push("Facts: " + facts.join("; ") + ".");
  var locObjs = ww.locationObjects[ww.currentLocation];
  if (locObjs) {
    var objList = [];
    for (var ok in locObjs) {
      if (locObjs.hasOwnProperty(ok)) objList.push(ok + " (" + locObjs[ok] + ")");
    }
    if (objList.length > 0) parts.push("Objects here: " + objList.join(", ") + ".");
  }
  if (ww.playerInventory.length > 0) {
    parts.push("Carrying: " + ww.playerInventory.join(", ") + ".");
  }
  return parts.join(" ");
}

function wwCheckContinuity(outputText) {
  if (!WW_CONFIG.ENABLE_CONTINUITY || typeof outputText !== "string") return;
  var lower = outputText.toLowerCase();
  var phase = WW_TIME_PHASES[state.WorldWeaver.timeIndex] || "";
  var nightPhases = ["evening", "night", "midnight"];
  if (nightPhases.indexOf(phase) !== -1) {
    if (lower.indexOf("bright sunlight") !== -1 || lower.indexOf("sunshine") !== -1) {
      log("WW CONTINUITY: daylight mentioned during " + phase);
    }
  }
  if (state.WorldWeaver.weather === "clear" && lower.indexOf("rain") !== -1 && lower.indexOf("no rain") === -1) {
    log("WW CONTINUITY: rain mentioned during clear weather");
  }
}

// ─── INPUT PARSING (no regex — string ops only) ───
function wwParseInput(inputText) {
  if (typeof inputText !== "string") return;
  var lower = inputText.toLowerCase();
  var ww = state.WorldWeaver;

  var takeWords = ["pick up", "take", "grab", "collect"];
  for (var t = 0; t < takeWords.length; t++) {
    var tw = takeWords[t];
    var idx = lower.indexOf(tw);
    if (idx !== -1) {
      var after = lower.substring(idx + tw.length).trim();
      after = after.replace(/^the\s+/, "");
      var end = after.search(/[.,;]/);
      if (end === -1) end = after.length;
      var item = after.substring(0, end).trim();
      if (item && item.length > 0 && item.length < 40 && ww.playerInventory.indexOf(item) === -1) {
        ww.playerInventory.push(item);
        if (ww.locationObjects[ww.currentLocation]) delete ww.locationObjects[ww.currentLocation][item];
        log("WW: +inventory '" + item + "'");
      }
      break;
    }
  }

  var dropWords = ["drop", "put down", "discard", "leave"];
  for (var d = 0; d < dropWords.length; d++) {
    var dw = dropWords[d];
    var didx = lower.indexOf(dw);
    if (didx !== -1) {
      var dafter = lower.substring(didx + dw.length).trim();
      dafter = dafter.replace(/^the\s+/, "");
      var dend = dafter.search(/[.,;]/);
      if (dend === -1) dend = dafter.length;
      var ditem = dafter.substring(0, dend).trim();
      if (ditem && ditem.length > 0 && ditem.length < 40) {
        var remIdx = ww.playerInventory.indexOf(ditem);
        if (remIdx !== -1) {
          ww.playerInventory.splice(remIdx, 1);
          if (!ww.locationObjects[ww.currentLocation]) ww.locationObjects[ww.currentLocation] = {};
          ww.locationObjects[ww.currentLocation][ditem] = "on the ground";
          log("WW: -inventory '" + ditem + "' @ " + ww.currentLocation);
        }
      }
      break;
    }
  }
}

// ─── MAIN ROUTER ───
var WorldWeaver = function(hook) {
  try {
    log("WW: === " + hook.toUpperCase() + " HOOK ===");

    if (!wwFixState()) {
      log("WW: State fix failed, aborting");
      return;
    }

    if (typeof text === "undefined") {
      log("WW: text is undefined, skipping");
      return;
    }

    if (hook === "input") {
      log("WW: Parsing input");
      wwParseInput(text);
    }
    else if (hook === "context") {
      log("WW: Building context");

      var detected = wwDetectLocation();
      var ww = state.WorldWeaver;
      if (detected && detected !== ww.currentLocation) {
        log("WW: Location → '" + detected + "'");
        ww.currentLocation = detected;
      }
      wwAdvanceWorld();

      var blocks = [];
      var t = wwGetTimeBlock();    if (t) blocks.push(t);
      var w = wwGetWeatherBlock(); if (w) blocks.push(w);
      var s = wwGetSensoryBlock(ww.currentLocation || "__default", WW_CONFIG.DETAIL_COUNT);
      if (s) blocks.push(s);
      var c = wwGetContinuityBlock(); if (c) blocks.push(c);
      var profile = WW_LOCATIONS[ww.currentLocation] || WW_LOCATIONS.__default;
      if (profile && profile.atmosphere) blocks.push("The atmosphere is " + profile.atmosphere + ".");

      if (blocks.length > 0) {
        var worldBlock = blocks.join("\n\n");
        if (worldBlock.length > WW_CONFIG.MAX_BLOCK_LENGTH) {
          worldBlock = worldBlock.substring(0, WW_CONFIG.MAX_BLOCK_LENGTH) + "...";
        }

        if (WW_CONFIG.USE_FRONT_MEMORY) {
          if (!state.memory) state.memory = {};
          if (!state.memory.frontMemory) state.memory.frontMemory = "";
          state.memory.frontMemory += "\n\n[World State]\n" + worldBlock + "\n[/World State]";
        } else {
          var safeText = wwSafeString(text);
          text = safeText + "\n\n[World State — Atmosphere & Continuity]\n" + worldBlock + "\n[End World State]\n";
        }
      }
    }
    else if (hook === "output") {
      log("WW: Processing output");
      wwRecordEvent(text);
      wwCheckContinuity(text);
    }

    log("WW: === " + hook.toUpperCase() + " DONE ===");
  } catch (e) {
    log("WW FATAL in " + (hook || "?") + ": " + (e.message || e));
  }
};

log("WW: Library loaded OK");