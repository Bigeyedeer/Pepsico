b4w.register("math_extra", function(exports, require) {

exports.d2r = function(degrees) {
  return Math.PI * degrees/180.0;
}

exports.mod = function(a, b) {
  b = Math.abs(b);
  if (a >= 0 | b == 0)
    return a % b;
  var t = a;
  for (; t < 0; t += b) {};
  return t;
}

});