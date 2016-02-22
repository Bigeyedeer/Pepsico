"use strict"

b4w.register("line_speed", function(exports, require) {

var m_scene_info = require("scene_info");

var scene_sizes = {
  mod_1_sec_1: 7011078,
  mod_1_sec_2: 8259313,
  mod_1_sec_3: 13725708,
  mod_1_sec_4_p1: 14934035,
  mod_1_sec_4_p2: 8777865,
  mod_1_sec_4_p3: 8651153,
  mod_1_sec_5: 4569898,
  mod_2_sec_2: 3066341,
  mod_2_sec_3: 9439391,
  mod_2_sec_4: 10754510,
  mod_2_sec_5: 9439373
}

var error_reported = false;
var stop_recalc = false;
var first_recalc = true;
var speed = 0;
var scene_name = "";

var HIGH = 1800;
var MED = 700;

exports.get_speed = function() {
  return speed;
}

exports.classify = function() {
  if (speed >= HIGH)
    return "HIGH";
  else if (speed >= MED)
    return "MED";
  else
    return "LOW";
}

exports.recalc_speed = function(percent, load_time) {
  if (first_recalc) {
    scene_name = m_scene_info.get_info("name");
    first_recalc = false;
  }
  if (stop_recalc)
    return;
  var size = scene_sizes[scene_name];
  if (size === undefined) {
    if (!error_reported) {
      console.error("Could not calculate speed for '"+exports.scene_name+"'.");
      error_reported = true;
    }
    return;
  }
  if (load_time == 0)
    return;
  speed = (size*8*(percent/100.0))/load_time;
  // console.log("Speed: "+speed);
}

exports.freeze = function() {
  stop_recalc = true;
}

});