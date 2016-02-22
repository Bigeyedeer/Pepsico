b4w.register("time_slices", function(exports, require) {

var m_quat      = require("quat");
var m_trans     = require("transform");
var m_time      = require("time");
var m_scenes    = require("scenes");
var m_mat       = require("material");
var m_objects   = require("objects");
var m_clock_sim = require("clock_sim");
var m_math_extra = require("math_extra");

var d2r = m_math_extra.d2r;
var mod = m_math_extra.mod;

var time_slice;
var slice_time = null;
var time_slices = new Array();

exports.set_up = function(time_slice_) {
  time_slice = time_slice_;
  m_clock_sim.add_listener("update_clock", update_slices);
  m_trans.set_scale(time_slice, 0);
}

exports.start_slices = function() {
  slice_time = Math.floor(m_clock_sim.get_time() / 5) * 5;
  update_slices();
}

exports.stop_slices = function() {
  update_slices();
  slice_time = null;
}

exports.get_slice_time = function() {
  return slice_time;
}

function lerp_colour(start_colour, end_colour, factor) {
  var rotcaf = 1 - factor;
  var new_colour = new Array(3);
  for (var i = 0; i < new_colour.length; i++)
    new_colour[i] = start_colour[i] * rotcaf + end_colour[i] * factor;
  return new_colour;
}

function ramp_colour(ramp, factor) {
  for (var i=0; i < ramp.length-1; i++) {
    if (ramp[i].point <= factor && factor <= ramp[i+1].point) {
      return lerp_colour(ramp[i].colour, ramp[i+1].colour, (factor - ramp[i].point)/(ramp[i+1].point - ramp[i].point));
    }
  }
  var ramp_max = ramp.slice(-1);
  if (factor >= ramp_max.point)
    return ramp_max.colour;
  return ramp[0].colour;
}

exports.set_slice_colour = function(colour) {
  m_mat.set_diffuse_color(time_slice, "Pie_Slice", colour);
}

exports.set_ramp_value = function(factor) {
  var ramp = [
    {point: 0.0, colour: [0.0, 1.0, 0.0]},
    {point: 0.5, colour: [0.84, 0.75, 0.0]},
    {point: 1.0, colour: [1.0, 0.0, 0.0]},
  ];
  exports.set_slice_colour(ramp_colour(ramp, factor));
}

exports.clear_slices = function() {
  slice_time = null;
  for (var i = 0; i < time_slices.length; i++) {
    m_scenes.remove_object(time_slices[i]);
  }
  time_slices = new Array();
}

function update_slices() {
  if (slice_time == null)
    return;
  var delta_time = m_clock_sim.get_time_passed(slice_time);
  var num_slices = Math.floor(delta_time / 5 + 1);
  for (var i = time_slices.length; i < num_slices && delta_time < 60; i++) {
    var new_slice = m_objects.copy(time_slice, "Time_Slice_"+i, false);
    var rot = m_quat.rotateX(m_quat.create(), d2r((slice_time+i*5)*-6.0), m_quat.create());
    m_trans.set_scale(new_slice, 1);
    m_trans.set_rotation_rel_v(new_slice, rot);
    m_scenes.append_object(new_slice);
    time_slices.push(new_slice);
  }
}

});