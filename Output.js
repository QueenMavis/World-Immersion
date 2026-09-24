// Remove identifiable World Immersion guidance leaks, including older versions.
// A guidance-only response gets a visible Retry notice, never an invisible blank.
WorldWeaver('output');
var modifier = function (value) { return { text: value }; };
modifier(text);
