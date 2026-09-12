WorldWeaver('context');
var modifier = function (value) {
  var result = { text: value };
  if (typeof stop !== 'undefined' && stop === true) result.stop = true;
  return result;
};
modifier(text);
