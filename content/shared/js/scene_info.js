"use strict"

b4w.register("scene_info", function(exports, require) {

var info = {};

exports.init = function(info_) {
  info = info_
}

exports.get_info = function(param) {
  return info[param];
}

});