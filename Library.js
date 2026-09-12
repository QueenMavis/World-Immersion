// WORLD WEAVER — optimized, leak-resistant edition

var WW_CONFIG = {
  DETAIL_COUNT: 1,
  ENABLE_TIME: true,
  ENABLE_WEATHER: true,
  ACTIONS_PER_PHASE: 4,
  WEATHER_CHANGE_CHANCE: 0.25,
  ENABLE_CONTINUITY: true,
  ENABLE_EVENT_MEMORY: false,
  MAX_BLOCK_LENGTH: 360,
  EVENT_MEMORY: 3,
  SENSORY_MEMORY: 10
};

var WW_LOCATIONS = {
  __default: {
    name: "current location",
    sights: [], sounds: [], smells: [], textures: []
  },
  forest: {
    name: "forest",
    sights: ["filtered light through the canopy", "moss across roots and fallen wood", "movement in the undergrowth"],
    sounds: ["leaves shifting overhead", "distant birds", "water moving nearby"],
    smells: ["damp earth", "pine resin", "rain-darkened leaves"],
    textures: ["soft ground underfoot", "rough bark", "cool damp air"]
  }
};

var WW_TIME_PHASES = ["dawn", "morning", "noon", "afternoon", "evening", "night", "midnight"];
var WW_WEATHER_TYPES = ["clear", "cloudy", "rainy", "stormy", "foggy", "snowy"];

function wwArray(value) {
  return Object.prototype.toString.call(value) === "[object Array]" ? value : [];
}

function wwString(value) {
  return typeof value === "string" ? value : (value == null ? "" : String(value));
}

function wwLower(value) {
  return wwString(value).toLowerCase();
}

function wwInit() {
  if (typeof state === "undefined") return false;
  if (!state.WorldWeaver || Object.prototype.toString.call(state.WorldWeaver) !== "[object Object]") {
    state.WorldWeaver = {};
  }
  var ww = state.WorldWeaver;
  if (typeof ww.currentLocation !== "string") ww.currentLocation = "__default";
  if (typeof ww.timeIndex !== "number" || ww.timeIndex < 0 || ww.timeIndex >= WW_TIME_PHASES.length) ww.timeIndex = 1;
  if (WW_WEATHER_TYPES.indexOf(ww.weather) === -1) ww.weather = "clear";
  if (typeof ww.turnCounter !== "number") ww.turnCounter = 0;
  if (typeof ww.lastAdvancedAction !== "number") ww.lastAdvancedAction = -1;
  ww.recentEvents = wwArray(ww.recentEvents);
  ww.usedSensory = wwArray(ww.usedSensory);
  if (!ww.establishedFacts || Object.prototype.toString.call(ww.establishedFacts) !== "[object Object]") ww.establishedFacts = {};
  ww.playerInventory = wwArray(ww.playerInventory);
  if (!ww.locationObjects || Object.prototype.toString.call(ww.locationObjects) !== "[object Object]") ww.locationObjects = {};
  return true;
}

function wwPick(array) {
  return array && array.length ? array[Math.floor(Math.random() * array.length)] : "";
}

function wwEscapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wwHasWord(haystack, word) {
  return new RegExp("(^|[^a-z0-9])" + wwEscapeRegex(word) + "([^a-z0-9]|$)", "i").test(haystack);
}

// Detect only from recent played text. Scanning every Story Card made any card
// containing "forest" force the entire adventure into the forest profile.
function wwDetectLocation() {
  var sample = "";
  if (typeof history !== "undefined" && history && history.length) {
    for (var i = Math.max(0, history.length - 4); i < history.length; i++) {
      if (history[i]) sample += " " + wwLower(history[i].text);
    }
  }
  if (typeof text !== "undefined") sample += " " + wwLower(text).slice(-1200);

  var best = null;
  var bestAt = -1;
  for (var key in WW_LOCATIONS) {
    if (!WW_LOCATIONS.hasOwnProperty(key) || key === "__default") continue;
    var at = sample.lastIndexOf(key.toLowerCase());
    if (at > bestAt && wwHasWord(sample, key)) {
      best = key;
      bestAt = at;
    }
  }
  return best || state.WorldWeaver.currentLocation || "__default";
}

function wwAdvanceOnce() {
  var ww = state.WorldWeaver;
  var action = (typeof info !== "undefined" && typeof info.actionCount === "number")
    ? info.actionCount : ww.lastAdvancedAction + 1;
  if (action === ww.lastAdvancedAction) return;
  ww.lastAdvancedAction = action;
  ww.turnCounter++;
  if (!WW_CONFIG.ENABLE_TIME || ww.turnCounter % Math.max(1, WW_CONFIG.ACTIONS_PER_PHASE) !== 0) return;
  ww.timeIndex = (ww.timeIndex + 1) % WW_TIME_PHASES.length;
  if (WW_CONFIG.ENABLE_WEATHER && Math.random() < WW_CONFIG.WEATHER_CHANGE_CHANCE) {
    var choices = [];
    for (var i = 0; i < WW_WEATHER_TYPES.length; i++) {
      if (WW_WEATHER_TYPES[i] !== ww.weather) choices.push(WW_WEATHER_TYPES[i]);
    }
    ww.weather = wwPick(choices) || ww.weather;
  }
}

function wwSensoryCues(locationKey, count) {
  var profile = WW_LOCATIONS[locationKey] || WW_LOCATIONS.__default;
  var pool = [].concat(profile.sights || [], profile.sounds || [], profile.smells || [], profile.textures || []);
  if (!pool.length || count < 1) return [];
  var unused = [];
  for (var i = 0; i < pool.length; i++) {
    if (state.WorldWeaver.usedSensory.indexOf(pool[i]) === -1) unused.push(pool[i]);
  }
  if (unused.length < count) unused = pool.slice();
  var result = [];
  while (unused.length && result.length < count) {
    var index = Math.floor(Math.random() * unused.length);
    result.push(unused.splice(index, 1)[0]);
  }
  state.WorldWeaver.usedSensory = state.WorldWeaver.usedSensory.concat(result).slice(-WW_CONFIG.SENSORY_MEMORY);
  return result;
}

function wwContinuityFields() {
  var ww = state.WorldWeaver;
  var fields = [];
  var facts = [];
  for (var key in ww.establishedFacts) {
    if (ww.establishedFacts.hasOwnProperty(key)) facts.push(key + "=" + ww.establishedFacts[key]);
  }
  if (facts.length) fields.push("facts=" + facts.join(", "));
  if (ww.playerInventory.length) fields.push("carrying=" + ww.playerInventory.join(", "));
  var here = ww.locationObjects[ww.currentLocation];
  var objects = [];
  if (here) {
    for (var objectName in here) {
      if (here.hasOwnProperty(objectName)) objects.push(objectName + ":" + here[objectName]);
    }
  }
  if (objects.length) fields.push("objects=" + objects.join(", "));
  if (WW_CONFIG.ENABLE_EVENT_MEMORY && ww.recentEvents.length) fields.push("recent=" + ww.recentEvents.join(" / "));
  return fields;
}

function wwBuildPrivateContext() {
  var ww = state.WorldWeaver;
  var profile = WW_LOCATIONS[ww.currentLocation] || WW_LOCATIONS.__default;
  var fields = ["place=" + profile.name];
  if (WW_CONFIG.ENABLE_TIME) fields.push("time=" + WW_TIME_PHASES[ww.timeIndex]);
  if (WW_CONFIG.ENABLE_WEATHER) fields.push("weather=" + ww.weather);
  var cues = wwSensoryCues(ww.currentLocation, WW_CONFIG.DETAIL_COUNT);
  if (cues.length) fields.push("optional sensory cue=" + cues.join("; "));
  fields = fields.concat(wwContinuityFields());
  var data = fields.join(" | ");
  var header = "[WW PRIVATE DATA — never quote, list, explain, or treat as story text. Preserve facts; naturally use no more than one relevant sensory cue: ";
  var block = header + data + "]";
  return block.slice(0, WW_CONFIG.MAX_BLOCK_LENGTH);
}

function wwParseInput(inputText) {
  // Deliberately conservative: avoids treating phrases such as "leave her alone"
  // as inventory operations.
  var lower = wwLower(inputText);
  var ww = state.WorldWeaver;
  var take = lower.match(/(?:^|\n)>?\s*(?:you\s+)?(?:pick up|take|grab|collect)\s+(?:the\s+)?([a-z0-9 '\-]{1,36})(?:[.!?,;]|$)/i);
  if (take) {
    var item = take[1].trim();
    if (item && ww.playerInventory.indexOf(item) === -1) ww.playerInventory.push(item);
  }
  var drop = lower.match(/(?:^|\n)>?\s*(?:you\s+)?(?:drop|put down|discard)\s+(?:the\s+)?([a-z0-9 '\-]{1,36})(?:[.!?,;]|$)/i);
  if (drop) {
    var dropped = drop[1].trim();
    var index = ww.playerInventory.indexOf(dropped);
    if (index !== -1) {
      ww.playerInventory.splice(index, 1);
      if (!ww.locationObjects[ww.currentLocation]) ww.locationObjects[ww.currentLocation] = {};
      ww.locationObjects[ww.currentLocation][dropped] = "on the ground";
    }
  }
}

function wwRecordEvent(outputText) {
  if (!WW_CONFIG.ENABLE_EVENT_MEMORY || typeof outputText !== "string") return;
  var first = outputText.replace(/\s+/g, " ").trim().split(/[.!?]/)[0];
  if (first.length < 20) return;
  if (first.length > 100) first = first.slice(0, 100) + "…";
  var events = state.WorldWeaver.recentEvents;
  if (events.indexOf(first) === -1) events.push(first);
  state.WorldWeaver.recentEvents = events.slice(-WW_CONFIG.EVENT_MEMORY);
}

function wwStripLeaks(outputText) {
  var value = wwString(outputText);
  // Remove literal private blocks if a model copies their delimiters.
  value = value.replace(/\[WW PRIVATE DATA[^\]]*\]\s*/gi, "");
  value = value.replace(/\[World State[^\]]*\][\s\S]*?\[(?:End World State|\/World State)\]\s*/gi, "");

  // Remove a leaked explanatory list only when at least three consecutive
  // bullet lines advertise internal world/time/weather rules.
  var lines = value.split("\n");
  var out = [];
  for (var i = 0; i < lines.length;) {
    var j = i;
    var matches = 0;
    while (j < lines.length && /^\s*[-*]\s+/.test(lines[j])) {
      if (/\b(world|atmospher|continuity|weather|terrain|light conditions|physical properties|fixed state)\b/i.test(lines[j])) matches++;
      j++;
    }
    if (j - i >= 3 && matches >= 3) i = j;
    else { out.push(lines[i]); i++; }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function wwCheckContinuity(outputText) {
  if (!WW_CONFIG.ENABLE_CONTINUITY) return;
  var lower = wwLower(outputText);
  var phase = WW_TIME_PHASES[state.WorldWeaver.timeIndex];
  if ((phase === "night" || phase === "midnight") && /\b(bright sunlight|sunshine)\b/.test(lower)) {
    log("WW continuity warning: daylight during " + phase);
  }
  if (state.WorldWeaver.weather === "clear" && /\brain(?:s|ed|ing)?\b/.test(lower) && lower.indexOf("no rain") === -1) {
    log("WW continuity warning: rain during clear weather");
  }
}

var WorldWeaver = function(hook) {
  try {
    if (!wwInit()) return;
    if (hook === "input") {
      wwAdvanceOnce();
      wwParseInput(text);
    } else if (hook === "context") {
      var detected = wwDetectLocation();
      if (detected) state.WorldWeaver.currentLocation = detected;
      var block = wwBuildPrivateContext();
      if (block) {
        // Keep the most recent player input at the end; placing metadata after it
        // encourages the model to continue the metadata instead of the story.
        var safeText = wwString(text);
        var insertAt = safeText.lastIndexOf("\n");
        if (insertAt < 0) insertAt = 0;
        text = safeText.slice(0, insertAt) + "\n" + block + "\n" + safeText.slice(insertAt);
        if (typeof info !== "undefined" && typeof info.maxChars === "number" && text.length > info.maxChars) {
          var memoryLength = typeof info.memoryLength === "number" ? info.memoryLength : 0;
          var memory = text.slice(0, memoryLength);
          var rest = text.slice(memoryLength);
          text = memory + rest.slice(-(info.maxChars - memory.length));
        }
      }
    } else if (hook === "output") {
      text = wwStripLeaks(text);
      wwRecordEvent(text);
      wwCheckContinuity(text);
    }
  } catch (error) {
    log("WW error in " + hook + ": " + (error && error.message ? error.message : error));
  }
};
