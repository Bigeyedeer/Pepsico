"use strict"

b4w.register("scene_mouse", function(exports, require) {

var m_scenes = require("scenes");
var m_events = require("events");
var m_main   = require("main");
var m_container = require("container");

var canvas;
var event_sys = new m_events.EventSystem(["change_hover"]);
var hover_target = null;
var hover_list = new Array();

exports.add_listener = event_sys.add_listener;
exports.remove_listener = event_sys.remove_listener;

exports.set_up = function() {
  canvas = m_container.get_canvas();
  canvas.addEventListener("mousemove", on_mouse_move);
  event_sys.add_listener("change_hover", on_change_hover);
}

function on_mouse_move(e) {
  var new_target = m_scenes.pick_object(e.clientX, e.clientY);
  if (new_target != hover_target) {
    var old_target = hover_target;
    hover_target = new_target;
    event_sys.dispatch_event("change_hover", {old_target: old_target, new_target: new_target});
  }
}

exports.get_hover_target = function() {
  return hover_target;
}

exports.disable_cursor_hover = function() {
  canvas.style.cursor = "default";
  event_sys.remove_listener("change_hover", on_change_hover);
}

exports.enable_cursor_hover = function() {
  event_sys.add_listener("change_hover", on_change_hover);
}

exports.set_hover_cursor = function(obj, cursor) {
  var found = false;
  if (typeof obj == "string") {
    obj = m_scenes.get_object_by_name(obj);
    if (obj == null)
      return;
  }
  for (var i = 0; i < hover_list.length; i++) {
    if (hover_list[i].obj == obj) {
      found = true;
      if (cursor != null)
        hover_list[i].cursor = cursor;
      else
        hover_list.splice(i, 1);
      break;
    }
  }
  if (!found && cursor != null)
    hover_list.push({obj: obj, cursor: cursor});
}

function on_change_hover(data) {
  if (data.new_target != null) {
    for (var i = 0; i < hover_list.length; i++) {
      if (hover_list[i].obj == data.new_target) {
        canvas.style.cursor = hover_list[i].cursor;
        return;
      }
    }
  }
  canvas.style.cursor = "default";
}

});