// WORLD IMMERSION 2.1 — standalone saved-script add-on
// Put in World Immersion's OWN Library tab. Leave manual Inner Self untouched.
var WW_CONFIG = {
  ACTIONS_PER_PHASE: 11,
  AUTO_ADVANCE_TIME: true,
  INITIAL_TIME: null, // null = unknown until an explicit narrative cue
  MAX_BLOCK_LENGTH: 520,
  DEBUG: false
};

var WorldWeaver = (function () {
  var phases = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night', 'midnight'];
  var open = '[WW_SCENE_GUIDANCE_V2: ';
  var close = ']';
  function object(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function validTime(x) { return phases.indexOf(x) !== -1; }
  function init() {
    // Separate namespace; do not import possibly incorrect legacy inventory/facts.
    if (!object(state.WorldImmersionV2)) state.WorldImmersionV2 = {};
    var s = state.WorldImmersionV2;
    if (!validTime(s.time)) s.time = validTime(WW_CONFIG.INITIAL_TIME) ? WW_CONFIG.INITIAL_TIME : null;
    if (!Number.isInteger(s.ticks) || s.ticks < 0) s.ticks = 0;
    if (!Array.isArray(s.checkpoints)) s.checkpoints = [];
    return s;
  }
  function checkpoint(s) { return {time:s.time, ticks:s.ticks}; }
  function restore(s, p) { s.time = p.time; s.ticks = p.ticks; }
  function count() {
    return typeof info !== 'undefined' && Number.isInteger(info.actionCount) ? info.actionCount : null;
  }
  function cue(value) {
    // Only explicit standalone narration. Ignore quoted dialogue, questions,
    // hypothetical plans, bare mentions, and most figurative references.
    var result = null;
    String(value || '').split(/[.!?\n]+/).forEach(function (line) {
      var m = line.trim().match(/^(?:it is|it's|it was|the time is|time is|time:|it is now|it's now)\s+(?:early |late )?(dawn|morning|noon|afternoon|evening|night|midnight)\s*$/i);
      if (m) result = m[1].toLowerCase();
    });
    return result;
  }
  function input(s, value) {
    var n = count();
    // Without an action identifier do not guess or double-count.
    if (n === null) return;
    var found = s.checkpoints.find(function (p) { return p.n === n; });
    if (found) {
      restore(s, found.before);
      s.checkpoints = s.checkpoints.filter(function (p) { return p.n < n; });
    } else if (Number.isInteger(s.lastAction) && n <= s.lastAction) {
      // Deep undo outside retained checkpoints: forget the inferred clock.
      s.time = null;
      s.ticks = 0;
      s.checkpoints = s.checkpoints.filter(function (p) { return p.n < n; });
    }
    var before = checkpoint(s);
    // Learn only from the latest committed story, never from all Story Cards.
    var h = typeof history !== 'undefined' && Array.isArray(history) ? history : [];
    var last = h.length ? h[h.length - 1] : null;
    var explicit = cue(value);
    if (!explicit && last && ['continue','story','start'].indexOf(last.type) !== -1) explicit = cue(last.text);
    if (explicit && explicit !== s.time) { s.time = explicit; s.ticks = 0; }
    else if (explicit) { s.ticks = 0; }
    else if (WW_CONFIG.AUTO_ADVANCE_TIME && s.time) {
      s.ticks++;
      var pace = Number.isInteger(WW_CONFIG.ACTIONS_PER_PHASE) && WW_CONFIG.ACTIONS_PER_PHASE > 0 ? WW_CONFIG.ACTIONS_PER_PHASE : 11;
      if (s.ticks >= pace) {
        s.time = phases[(phases.indexOf(s.time) + 1) % phases.length];
        s.ticks = 0;
      }
    }
    s.lastAction = n;
    s.checkpoints.push({n:n, before:before});
    s.checkpoints = s.checkpoints.slice(-80);
  }
  function context(s, value) {
    if (typeof stop !== 'undefined' && stop === true) return value;
    // Never duplicate a block if this hook is called twice with its own result.
    if (value.indexOf(open) !== -1) return value;
    var base = 'Use as background guidance, not story text. For story narration only, continue the current scene without recap. Preserve established surroundings and object positions. Let travel and elapsed time follow the story. Add sensory detail only when relevant and consistent; do not invent player actions or feelings.';
    var clock = s.time ? ' Tentative time: ' + s.time + '; explicit story time and scene pacing take priority.' : '';
    var block = open + base + clock + close;
    var cap = Number.isFinite(WW_CONFIG.MAX_BLOCK_LENGTH) ? Math.max(0, WW_CONFIG.MAX_BLOCK_LENGTH) : 520;
    if (block.length > cap) block = open + base + close;
    if (block.length > cap) return value;
    // Other scripts can rebuild context, making memoryLength stale.
    // Prepend a complete note without splitting the received prompt.
    var addition = '\n\n' + block + '\n\n';
    // At full capacity, skip optional guidance instead of deleting story text.
    if (typeof info !== 'undefined' && Number.isFinite(info.maxChars) && value.length + addition.length > info.maxChars) return value;
    return addition + value;
  }
  return function (hook) {
    var original = typeof text === 'string' ? text : null;
    if (original === null || typeof state === 'undefined') return;
    try {
      var s = init();
      if (hook === 'input') input(s, original);
      else if (hook === 'context') text = context(s, original);
      // Output is intentionally untouched. Inner Self owns thought extraction.
      // Do not save generated output as a second, potentially stale memory.
    } catch (e) {
      text = original;
      if (WW_CONFIG.DEBUG && typeof log === 'function') log('World Immersion: ' + e.message);
    }
  };
})();
