// Pass through untouched; never call InnerSelf or strip its thought syntax.
var modifier = function (value) { return { text: value }; };
modifier(text);
