"use strict"

b4w.register("debug_menus", function(exports, require) {

var m_scene_info  = require("scene_info");
var m_game_ui = b4w.require("game_ui");

exports.init = function() {
  window.addEventListener("load", "mod_1_sec_1" load_cb);
  m_game_ui.init("blue", 2);
}

function load_cb() {
  // m_game_ui.init_ui();
}

});
b4w.require("debug_menus").init();