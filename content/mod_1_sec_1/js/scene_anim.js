"use strict"

b4w.register("scene_anim", function(exports, require) {

var m_scenes     = require("scenes");
var m_anim       = require("animation");
var m_anix       = require("anim_extra");
var m_time       = require("time");

var keani;
var chair;

var state = "none";

var queue = new m_anix.AnimationQueue();

exports.set_up = function() {
  keani = m_scenes.get_object_by_name("Keani_Office");
  chair = m_scenes.get_object_by_name("Chair_Armature");
}

function pingpong(obj, loop, slot) {
  slot = typeof slot !== 'undefined' ? slot : 0;
  loop = typeof loop !== 'undefined' ? loop : true;
  var backwards = function() {
    m_anim.set_behavior(obj, m_anim.AB_FINISH_STOP, slot);
    m_anim.set_speed(obj, -1.0, slot);
    m_anim.play(obj, loop ? forwards : null, slot);
  };
  var forwards = function() {
    m_anim.set_behavior(obj, m_anim.AB_FINISH_STOP, slot);
    m_anim.set_speed(obj, 1.0, slot);
    m_anim.play(obj, backwards, slot);
  };
  forwards();
}

exports.when_queue_empty = function(callback) {
  if (queue.get_state() == "idle") {
    callback();
    return;
  }

  function listener() {
    queue.remove_listener("empty", listener);
    callback();
  }
  queue.add_listener("empty", listener);
}

exports.idle = function() {
  if (state == "idle")
    return false;
  state = "idle";
  m_anim.apply(keani, "Keani_Chairpos_Moveit_B4W_BAKED");
  m_anim.set_behavior(keani, m_anim.AB_FINISH_STOP);
  m_anim.set_last_frame(keani);
  m_anim.apply(chair, "Keani_Chair_Lower_B4W_BAKED");
  m_anim.set_behavior(chair, m_anim.AB_FINISH_STOP);
  m_anim.set_last_frame(chair);
  return true;
}

exports.drop_chair = function() {
  if (state == "drop")
    return false;
  state = "drop";
  queue.add(m_anix.combine(
    m_anix.create_anim(keani, "Keani_Chairpos_Moveit_B4W_BAKED"),
    m_anix.create_anim(chair, "Keani_Chair_Lower_B4W_BAKED")));
}

exports.use_footstool = function() {
  if (state == "use_footstool")
    return false;
  state = "use_footstool";
  queue.add(m_anix.create_anim(keani, "Keani_Chairpos_Footstool_B4W_BAKED"));
}

exports.lift_chair = function() {
  if (state == "lift_chair")
    return false;
  state = "lift_chair";
  queue.add(m_anix.combine(
    m_anix.create_anim(keani, "Keani_Chairpos_Moveit_B4W_BAKED", -1),
    m_anix.create_anim(chair, "Keani_Chair_Lower_B4W_BAKED", -1)));
}

exports.shrug = function() {
  if (state == "shrug")
    return false;
  state = "shrug";
  queue.add(m_anix.create_anim(keani, "Keani_Chairpos_Shrug_B4W_BAKED", 1, m_anix.PINGPONG));
}

exports.reach_to = function(frame) {
  if (state == "reach_to")
    return false;
  state = "reach_to";
  m_anim.apply(chair, "Keani_Chair_Lower_B4W_BAKED");
  m_anim.apply(keani, "Keani_Chairpos_Reach_B4W_BAKED");
  var set_frame = function(f) {
    m_anim.set_frame(keani, f);
  }
  m_time.animate(0, frame, m_anim.frame_to_sec(frame)*1000, set_frame);
}

exports.set_reach = function(frame) {
  state = "reach";
  m_anim.apply(chair, "Keani_Chair_Lower_B4W_BAKED");
  m_anim.set_frame(keani, frame);
}

exports.unreach = function() {
  if (state == "unreach")
    return false;
  state = "unreach";
  m_anim.apply(keani, "Keani_Chairpos_Reach_B4W_BAKED");
  m_anim.set_behavior(keani, m_anim.AB_FINISH_STOP);
  m_anim.set_last_frame(keani);
  m_anim.set_speed(keani, -1.0);
  m_anim.play(keani);
}

exports.start_typing = function() {
  if (state == "start_typing")
    return false;
  state = "start_typing";
  m_anim.apply(keani, "Keani_Chairpos_Type_Start_B4W_BAKED");
  m_anim.set_behavior(keani, m_anim.AB_FINISH_STOP);
  m_anim.play(keani, exports.typing_loop);
}

exports.typing_loop = function() {
  if (state == "typing_loop")
    return false;
  state = "typing_loop";
  m_anim.apply(keani, "Keani_Chairpos_Type_Loop_B4W_BAKED");
  pingpong(keani);
}

exports.stretch = function() {
  if (state == "stretch")
    return false;
  state = "stretch";
  m_anim.apply(keani, "Keani_Chairpos_Stretch_B4W_BAKED");
  m_anim.set_behavior(keani, m_anim.AB_FINISH_STOP);
  m_anim.play(keani);
}

exports.get_state = function() {
  return state;
}

});
