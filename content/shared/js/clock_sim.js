"use strict"

b4w.register("clock_sim", function(exports, require) {

var m_quat       = require("quat");
var m_trans      = require("transform");
var m_time       = require("time");
var m_math_extra = require("math_extra");
var m_events     = require("events");

var state = "none";
var time = 0.0;
var time_scale = 1.0;
var old_timeline = 0.0;
var hour_hand;
var minute_hand;
var alarm = null;
var to_time = 0.0;
var old_time_scale = 1.0;

var event_system = new m_events.EventSystem(["update_clock", "alarm", "wind_back"]);

exports.add_listener = event_system.add_listener;
exports.remove_listener = event_system.remove_listener;
var d2r = m_math_extra.d2r;
var mod = m_math_extra.mod;

exports.manage_clock = function(hour_hand_, minute_hand_) {
  hour_hand = hour_hand_;
  minute_hand = minute_hand_;
}

function update_clock() {
  var hours = time/60;
  var minutes = time % 60;
  var rot = m_quat.rotateY(m_quat.create(), d2r(minutes*-6.0), m_quat.create());
  m_trans.set_rotation_rel_v(minute_hand, rot);
  rot = m_quat.rotateY(m_quat.create(), d2r(hours*-30.0), m_quat.create());
  m_trans.set_rotation_rel_v(hour_hand, rot);
  event_system.dispatch_event("update_clock");
  check_alarm();
}

function wind_back_update() {
  if (state != "winding_back")
    return;
  if (to_time > time) {
    state = "running";
    exports.set_time_scale(old_time_scale);
    event_system.remove_listener("update_clock", wind_back_update);
    exports.set_time(to_time);
    event_system.dispatch_event("wind_back");
    return;
  }
}

exports.wind_back = function(to_time_, speed) {
  if (state != "running")
    return;
  to_time = to_time_;
  speed = -Math.abs(speed);
  old_time_scale = exports.get_time_scale();
  state = "winding_back";
  exports.set_time_scale(speed);
  event_system.add_listener("update_clock", wind_back_update);
}

function check_alarm() {
  if (alarm == null)
    return;
  if (time > alarm) {
    event_system.dispatch_event("alarm");
    alarm = null;
  }
}

exports.set_time_hm = function(hours, minutes) {
  hours = mod(hours, 24);
  minutes = mod(minutes, 60);
  time = hours*60 + minutes;
  update_clock();
}

exports.set_time = function(time_) {
  time = mod(time_, 720.0);
  update_clock();
}

exports.set_alarm = function(alarm_) {
  alarm = alarm_;
}

exports.get_time_passed = function(time_) {
  return mod(time - time_, 720.0);
}

exports.get_time = function() {
  return time;
}

exports.set_time_scale = function(time_scale_) {
  time_scale = time_scale_;
}

exports.get_time_scale = function() {
  return time_scale;
}

function animate_cb() {
  var new_timeline = m_time.get_timeline();
  var delta_time = (new_timeline - old_timeline)/60;
  exports.set_time(time + (delta_time * time_scale));
  old_timeline = new_timeline;
}

exports.animate = function() {
  var ms = 43200000.0;
  old_timeline = m_time.get_timeline();
  m_time.set_timeout(exports.animate, ms);
  m_time.animate(0, 720.0, ms, animate_cb);
  state = "running";
}

exports.lerp_time_scale = function(from, to, ms) {
  m_time.animate(from, to, ms, exports.set_time_scale);
}

});