"use strict"

if (b4w.module_check("planes"))
  throw "The namespace 'planes' is not available, could not register module";

b4w.register("planes", function(exports, require) {

var m_vec3 = require("vec3");
var m_util = require("util");
var m_app = require("app");
var m_main = require("main");
var m_container = require("container");
var m_camera = require("camera");
var m_phy = require("physics");
var m_scenes = require("scenes");
var m_quat = require("quat");
var m_trans = require("transform");
var m_events = require("events");
var m_mouse = require("mouse");

var is_initialised = false;
var manage_camera_controls = false;
var dragging = null;
var draggables = new Array();
var listenables = {
  dragging: new m_events.Listenable(),
  let_go: new m_events.Listenable()
};

function Draggable(obj, plane, constrained, enabled) {
  this.obj = obj;
  this.plane = plane;
  this.constrained = typeof constrained !== 'undefined' ? constrained : true;
  this.enabled = typeof enabled !== 'undefined' ? enabled : true;
  this.listenable = new m_events.Listenable();
  this.offset = new Float32Array(2);
}

function Plane(pos, rot, dim) {
  this.position = typeof pos !== 'undefined' ? pos : m_vec3.create();
  this.rotation = typeof rot !== 'undefined' ? rot : m_quat.create();
  this.dimensions = typeof dim !== 'undefined' ? dim : new Float32Array(2);
}
exports.Plane = Plane;

exports.add_listener = function(name, listener) {
  if (!listenables[name])
    return;
  listenables[name].add_listener(listener);
}

exports.remove_listener = function(name, listener) {
  if (!listenables[name])
    return;
  listenables[name].remove_listener(listener);
}

exports.init = function() {
  if (is_initialised)
    return;
  var canvas = m_container.get_canvas();
  canvas.addEventListener("mousedown", on_mouse_down);
  canvas.addEventListener("touchstart", on_mouse_down);
  canvas.addEventListener("mousemove", on_mouse_move);
  canvas.addEventListener("touchmove", on_mouse_move);
  canvas.addEventListener("mouseup", on_mouse_up);
  canvas.addEventListener("touchend", on_mouse_up);
  is_initialised = true;
}

exports.manage_camera_controls = function(state) {
  manage_camera_controls = state;
}

exports.ray_plane_intercept = function(plane, pos, dir, constrain) {
  constrain = typeof constrain !== 'undefined' ? constrain : false;
  var localX = m_vec3.transformQuat(m_util.AXIS_X, plane.rotation, m_vec3.create());
  var localY = m_vec3.transformQuat(m_util.AXIS_Y, plane.rotation, m_vec3.create());
  var localZ = m_vec3.transformQuat(m_util.AXIS_Z, plane.rotation, m_vec3.create());
  var half_dim = new Float32Array(2);
  half_dim[0] = plane.dimensions[0]/2;
  half_dim[1] = plane.dimensions[1]/2;

  var length = m_vec3.dot(m_vec3.sub(plane.position, pos, m_vec3.create()), localY) /
               m_vec3.dot(dir, localY);

  var intercept = m_vec3.add(pos, m_vec3.mul(dir, m_vec3.set(length, length, length, m_vec3.create()), m_vec3.create()), m_vec3.create());
  var p_intercept = new Float32Array(2);
  p_intercept[0] = m_vec3.dot(m_vec3.sub(intercept, plane.position, m_vec3.create()), localX);
  p_intercept[1] = m_vec3.dot(m_vec3.sub(intercept, plane.position, m_vec3.create()), localZ);

  // Very messy:
  if (constrain) {
    if (p_intercept[0] > half_dim[0]) {
      var delta = p_intercept[0] - half_dim[0];
      intercept = m_vec3.sub(intercept, m_vec3.mul(localX, m_vec3.set(delta, delta, delta, m_vec3.create()), m_vec3.create()), m_vec3.create());
    }
    else if (p_intercept[0] < -half_dim[0]) {
      var delta = p_intercept[0] + half_dim[0];
      intercept = m_vec3.sub(intercept, m_vec3.mul(localX, m_vec3.set(delta, delta, delta, m_vec3.create()), m_vec3.create()), m_vec3.create());
    }

    if (p_intercept[1] > half_dim[1]) {
      var delta = p_intercept[1] - half_dim[1];
      intercept = m_vec3.sub(intercept, m_vec3.mul(localZ, m_vec3.set(delta, delta, delta, m_vec3.create()), m_vec3.create()), m_vec3.create());
    }
    else if (p_intercept[1] < -half_dim[1]) {
      var delta = p_intercept[1] + half_dim[1];
      intercept = m_vec3.sub(intercept, m_vec3.mul(localZ, m_vec3.set(delta, delta, delta, m_vec3.create()), m_vec3.create()), m_vec3.create());
    }
  }

  return intercept;
}

function update_dragging(e) {
  if (!dragging)
    return;
  var x = m_mouse.get_coords_x(e);
  var y = m_mouse.get_coords_y(e);
  var camera = m_scenes.get_active_camera();
  var dir = m_camera.calc_ray(camera, x + dragging.offset[0], y + dragging.offset[1]);
  var pos = m_trans.get_translation(camera);

  var obj_pos = exports.ray_plane_intercept(dragging.plane, pos, dir, dragging.constrained);
  m_vec3.add(obj_pos, dragging.offset, m_vec3.create());
  m_trans.set_translation_v(dragging.obj, obj_pos);
  listenables.dragging.dispatch_event(dragging);
}

function on_mouse_down(e) {
  var x = m_mouse.get_coords_x(e);
  var y = m_mouse.get_coords_y(e);
  var obj = m_scenes.pick_object(x, y);
  if (obj == null)
    return;
  for (var i = 0; i < draggables.length; i++) {
    if (draggables[i].obj == obj) {
      if (draggables[i].enabled)
        dragging = draggables[i];
      break;
    }
  }
  if (!dragging)
    return;
  if (manage_camera_controls)
    m_app.disable_camera_controls();

  var camera = m_scenes.get_active_camera();
  var obj_pos = m_trans.get_translation(obj);
  var centre = new Float32Array(2);
  m_camera.project_point(camera, obj_pos, centre);

  dragging.offset[0] = centre[0] - x;
  dragging.offset[1] = centre[1] - y;
  update_dragging(e);
}

function on_mouse_move(e) {
  update_dragging(e);
}

function on_mouse_up(e) {
  if(!dragging)
    return;
  var tmp = dragging;
  dragging = null;
  if (manage_camera_controls)
    m_app.enable_camera_controls();
  listenables.let_go.dispatch_event(tmp);
}

exports.create = function() {
  return new Plane();
}

exports.make_draggable = function(obj, plane, constrained, enabled) {
  draggables.push(new Draggable(obj, plane, constrained, enabled));
}

exports.set_enabled = function(obj, state) {
  for (var i = 0; i < draggables.length; i++) {
    if (draggables[i].obj == obj) {
      draggables[i].enabled = state;
      return true;
    }
  }
  return false;
}

exports.plane_from_scene = function(obj) {
  var start = m_trans.get_translation(obj);
  var children = m_scenes.get_object_children(obj);
  var plane = exports.create();
  plane.rotation = m_trans.get_rotation(obj);
  if (children.length > 0) {
    var end = m_trans.get_translation(children[0]);
    var end_rel = m_trans.get_translation_rel(children[0]);
    plane.position = m_vec3.div(m_vec3.add(start, end, m_vec3.create()), m_vec3.set(2, 2, 2, m_vec3.create()), m_vec3.create());
    plane.dimensions[0] = Math.abs(end_rel[0]);
    plane.dimensions[1] = Math.abs(end_rel[2]);
  }
  else {
    plane.position = start;
    plane.dimensions[0] = 0;
    plane.dimensions[1] = 1;
  }
  return plane;
}

});