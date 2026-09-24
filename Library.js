// WORLD IMMERSION 2.9 — flow-first immersion with two-action sensory rotation
// Put in World Immersion's OWN Library tab. Leave manual Inner Self untouched.
var WW_CONFIG = {
  ACTIONS_PER_PHASE: 20,
  AUTO_ADVANCE_TIME: true,
  INITIAL_TIME: null, // null = unknown until an explicit narrative cue
  MAX_BLOCK_LENGTH: 360,
  DEBUG: false
};

var WorldWeaver = (function () {
  var phases = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night', 'midnight'];
  var open = '[WW_SCENE_GUIDANCE_V29: ';
  var close = ']';
  // Rotate categories, not prewritten descriptions. The AI supplies the detail.
  var senses = ['Sight', 'Sound', 'Scent', 'Touch'];
  var prompts = [
    'Sight—if natural, weave in one brief visible detail from a present person, object, or place',
    'Sound—if natural, weave in one brief sound from a present person, action, object, or place',
    'Scent—if natural, weave in one brief plausible scent from a present person, object, or place',
    'Touch—if natural, weave in one brief physical sensation already supported by contact or proximity'
  ];
  function sensory(s, n) {
    var records = s.sensoryPacing.filter(function (r) { return r.n <= n; });
    var cached = records.find(function (r) { return r.n === n; });
    var earlier = records.filter(function (r) { return r.n < n; });
    var before = cached ? cached.before :
      (earlier.length ? earlier[earlier.length - 1].after : {ticks:0, ordinal:0});
    var after = {ticks:before.ticks + 1, ordinal:before.ordinal};
    // First cue on counted generation 2, then every second new generation.
    var due = after.ticks >= 2;
    var sense = senses[after.ordinal % 4];
    var index = after.ordinal % senses.length;
    return {before:before, after:after, records:earlier, due:due,
      id:sense, cue:prompts[index]};
  }
  function rememberSensory(s, n, selection, emitted) {
    if (emitted) { selection.after.ticks = 0; selection.after.ordinal++; }
    s.sensoryPacing = selection.records.concat([{
      n:n, before:selection.before, after:selection.after,
      emitted:emitted, id:emitted ? selection.id : null
    }]).slice(-80);
  }
  function object(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function natural(x) { return Number.isSafeInteger(x) && x >= 0; }
  function clockState(p) { return object(p) && (p.time === null || validTime(p.time)) && natural(p.ticks); }
  function pacingState(p) { return object(p) && natural(p.ticks) && natural(p.ordinal); }
  function validTime(x) { return phases.indexOf(x) !== -1; }
  function init() {
    // Separate namespace; do not import possibly incorrect legacy inventory/facts.
    if (!object(state.WorldImmersionV2)) state.WorldImmersionV2 = {};
    var s = state.WorldImmersionV2;
    if (!validTime(s.time)) s.time = validTime(WW_CONFIG.INITIAL_TIME) ? WW_CONFIG.INITIAL_TIME : null;
    if (!Number.isInteger(s.ticks) || s.ticks < 0) s.ticks = 0;
    if (!Array.isArray(s.checkpoints)) s.checkpoints = [];
    if (!Array.isArray(s.sensoryPacing)) s.sensoryPacing = [];
    s.checkpoints = s.checkpoints.filter(function (p) {
      return object(p) && natural(p.n) && clockState(p.before);
    }).slice(-80);
    s.sensoryPacing = s.sensoryPacing.filter(function (p) {
      return object(p) && natural(p.n) && pacingState(p.before) && pacingState(p.after);
    }).slice(-80);
    return s;
  }
  function checkpoint(s) { return {time:s.time, ticks:s.ticks, lastHistoryCue:s.lastHistoryCue, timeNotice:s.timeNotice || null}; }
  function restore(s, p) { s.time = p.time; s.ticks = p.ticks; s.lastHistoryCue = p.lastHistoryCue; s.timeNotice = p.timeNotice || null; }
  function count() {
    return typeof info !== 'undefined' && info && natural(info.actionCount) ? info.actionCount : null;
  }
  function cue(value) {
    // Narrow present-tense narration only. Keep punctuation so questions
    // cannot become time declarations; conservatively omit quoted passages.
    var result = null;
    // Scan quotes without mistaking apostrophes in contractions for quotation
    // marks. Quote state spans newlines; unmatched quotes are conservative.
    var source = String(value || ''), narration = '', quote = null;
    for (var i = 0; i < source.length; i++) {
      var c = source[i];
      var apostrophe = (c === "'" || c === '’') && /[A-Za-z]/.test(source[i - 1] || '') && /[A-Za-z]/.test(source[i + 1] || '');
      if (!apostrophe && quote && c === quote) { quote = null; narration += ' '; }
      else if (!apostrophe && !quote && /["“'‘]/.test(c)) {
        quote = c === '“' ? '”' : c === '‘' ? '’' : c;
        narration += ' ';
      } else narration += quote ? (c === '\n' ? '\n' : ' ') : c;
    }
    (narration.match(/[^.!?\n]+[.!?]*/g) || []).forEach(function (line) {
      if (line.indexOf('?') !== -1) return;
      var m = line.trim().match(/^(?:it is|it's|it’s|the time is|time is|time:)\s+(?:now\s+)?(?:early |late )?(dawn|morning|noon|afternoon|evening|night|midnight)\s*[.!]*$/i);
      if (m) result = m[1].toLowerCase();
    });
    return result;
  }
  function fingerprint(value) {
    // Bounded identifier, never a second copy of story prose in state.
    var h = 2166136261;
    for (var i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
    return value.length + ':' + (h >>> 0);
  }
  function input(s, value) {
    if (typeof stop !== 'undefined' && stop === true) return;
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
      s.lastHistoryCue = null;
      s.timeNotice = null;
      s.checkpoints = s.checkpoints.filter(function (p) { return p.n < n; });
    }
    var before = checkpoint(s);
    // Learn only from the latest committed story, never from all Story Cards.
    var h = typeof history !== 'undefined' && Array.isArray(history) ? history : [];
    var last = h.length ? h[h.length - 1] : null;
    var explicit = cue(value);
    if (last && ['continue','story','start'].indexOf(last.type) !== -1) {
      var historical = cue(last.text);
      if (historical) {
        var key = fingerprint(String(last.text));
        if (!explicit && key !== s.lastHistoryCue) explicit = historical;
        s.lastHistoryCue = key;
      }
    }
    if (explicit && explicit !== s.time) { s.time = explicit; s.ticks = 0; s.timeNotice = null; }
    else if (WW_CONFIG.AUTO_ADVANCE_TIME && s.time) {
      s.ticks++;
      var pace = Number.isInteger(WW_CONFIG.ACTIONS_PER_PHASE) && WW_CONFIG.ACTIONS_PER_PHASE > 0 ? WW_CONFIG.ACTIONS_PER_PHASE : 20;
      if (s.ticks >= pace) {
        s.time = phases[(phases.indexOf(s.time) + 1) % phases.length];
        s.ticks = 0;
        s.timeNotice = {n:n, time:s.time};
      }
    }
    s.lastAction = n;
    s.checkpoints.push({n:n, before:before});
    s.checkpoints = s.checkpoints.slice(-80);
  }
  function context(s, value) {
    if (typeof stop !== 'undefined' && stop === true) return value;
    var boundary = typeof info !== 'undefined' && info && natural(info.memoryLength) ? Math.min(info.memoryLength, value.length) : 0;
    var cleaned = stripGuidance(value, boundary, true);
    value = cleaned.text;
    boundary = cleaned.boundary;
    var n = count();
    if (n === null) return value;
    var choice = sensory(s, n);
    var parts = [];
    if (choice.due) parts.push('Continue directly; keep established scene facts. Cue: ' + choice.cue + '.');
    if (object(s.timeNotice) && s.timeNotice.n === n && validTime(s.timeNotice.time)) {
      parts.push('Time has gradually shifted to ' + s.timeNotice.time + '; keep it natural, and let explicit story timing override it.');
    }
    if (!parts.length) {
      rememberSensory(s, n, choice, false);
      return value;
    }
    var cap = Number.isFinite(WW_CONFIG.MAX_BLOCK_LENGTH) ? Math.max(0, WW_CONFIG.MAX_BLOCK_LENGTH) : 360;
    var available = typeof info !== 'undefined' && info && Number.isFinite(info.maxChars) ? info.maxChars - value.length - 4 : cap;
    var limit = Math.min(cap, available);
    var block = open + parts.join(' ') + close;
    var emitted = choice.due;
    if (block.length > limit) {
      rememberSensory(s, n, choice, false);
      return value;
    }
    var addition = '\n\n' + block + '\n\n';
    rememberSensory(s, n, choice, emitted);
    // Insert after AI Dungeon's memory segment. This preserves the documented
    // memoryLength boundary for any context script that runs after this one.
    // Other context scripts may have rebuilt the prompt. Never split a word
    // or instruction mid-line using a stale memoryLength offset.
    if (boundary > 0 && boundary < value.length && value[boundary] !== '\n' && value[boundary - 1] !== '\n') {
      var nextLine = value.indexOf('\n', boundary);
      boundary = nextLine < 0 ? value.length : nextLine;
    }
    return value.slice(0, boundary) + addition + value.slice(boundary);
  }
  function stripGuidance(value, boundary, contextMode) {
    // Inner Self may normalize underscores out of generated prose.
    var spans = [], marker = /\[WW_?SCENE_?GUIDANCE_?V\d+\s*:/gi, m;
    while ((m = marker.exec(value))) {
      var start = m.index, end = value.indexOf(']', marker.lastIndex);
      var nested = value.indexOf('[', marker.lastIndex);
      if (end >= 0 && end - start <= 4096 && (nested < 0 || nested > end)) end++;
      else {
        // An unclosed marker has no reliable end: remove its first line only.
        // Preserve subsequent prose instead of guessing where it resumes.
        end = value.indexOf('\n', marker.lastIndex);
        if (end < 0) end = value.length;
        // Recognize only unmistakable continuation lines from our own prompts.
        // Unmarked/ambiguous prose is deliberately not broadly filtered.
        while (end < value.length) {
          var lineEnd = value.indexOf('\n', end + 1);
          if (lineEnd < 0) lineEnd = value.length;
          var line = value.slice(end + 1, lineEnd).trim();
          if (!/^(?:Private (?:guidance|background guidance);|Continue (?:directly;|from the latest action without recap|without recap|the current scene without recap)|Maintain established people, surroundings, objects|Weave ONE brief optional detail|Choose the most relevant established person|Vary focus; avoid a checklist|Omit if unsupported or disruptive|Do not add a person, object, discovery, threat or event|Cue:\s*(?:Sight|Sound|Scent|Smell|Touch)\b|Tentative time:|Time has gradually shifted to)/i.test(line)) break;
          end = lineEnd;
        }
      }
      if (contextMode && value.slice(start - 2, start) === '\n\n' && value.slice(end, end + 2) === '\n\n') {
        start -= 2; end += 2;
      } else if (!contextMode) {
        while (value[end] === ' ' || value[end] === '\t') end++;
        if (value[end] === '\r') end++;
        if (value[end] === '\n') end++;
      }
      spans.push({start:start, end:end}); marker.lastIndex = end;
    }
    var out = '', pos = 0, mapped = boundary;
    spans.forEach(function (span) {
      out += value.slice(pos, span.start); pos = span.end;
      mapped -= Math.max(0, Math.min(boundary, span.end) - Math.min(boundary, span.start));
    });
    return {text:out + value.slice(pos), boundary:mapped, removed:spans.length};
  }
  function output(value) {
    var cleaned = stripGuidance(value, 0, false);
    if (!cleaned.removed) return value;
    if (cleaned.text.replace(/[\s\u200B-\u200D\uFEFF]/g, '').length) return cleaned.text;
    // Visible recovery, not fabricated prose, invisible output or stop:true.
    return 'World Immersion notice: this response contained only script guidance. Please Retry.';
  }
  return function (hook) {
    var original = typeof text === 'string' ? text : null;
    if (original === null) return;
    try {
      if (hook === 'output') { text = output(original); return; }
      if (typeof state === 'undefined' || !object(state)) return;
      var s = init();
      if (hook === 'input') input(s, original);
      else if (hook === 'context') text = context(s, original);
      // Output changes only when an internal World Immersion block was echoed.
      // Inner Self remains responsible for its own thought extraction.
    } catch (e) {
      text = original;
      if (WW_CONFIG.DEBUG && typeof log === 'function') log('World Immersion: ' + e.message);
    }
  };
})();
