"use strict"

b4w.register("scene_cache", function(exports, require) {

var m_scenes = require("scenes");

var game_objects = new Object();

exports.gobj = function(name) {
  if (game_objects[name] !== undefined)
    return game_objects[name];
  else {
    game_objects[name] = m_scenes.get_object_by_name(name);
    return game_objects[name];
  }
}

});
