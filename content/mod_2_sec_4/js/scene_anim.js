"use strict"

b4w.register("scene_anim", function(exports, require) {

var m_scenes = require("scenes");
var m_events = require("events");
var m_anim   = require("animation");
var m_nla    = require("nla");
var m_time   = require("time");

exports.ANIM_ANWAR_IDLE = 0;
exports.ANIM_ANWAR_NOTIFY_PERSONNEL = 1;
exports.ANIM_ANWAR_GUARDS_AWAY = 2;
exports.ANIM_ANWAR_IDLE2 = 3;
exports.ANIM_ANWAR_TOOLS_AWAY = 4;
exports.ANIM_ANWAR_ISOLATOR_TAG = 5;

var anwar;
var walkie_2;
var screwdriver_1;
var screwdriver_2;
var wrench_1;
var wrench_2;
var motor;

var event_sys = new m_events.EventSystem(["anim_start", "anim_finish"]);

exports.add_listener = event_sys.add_listener;
exports.remove_listener = event_sys.remove_listener;

function mk_finish_cb(anim_id) {
  return function(obj, slot_num) {
    event_sys.dispatch_event("anim_finish", {id: anim_id, obj: obj, slot_num: slot_num});
  }
}

exports.set_up = function() {
  anwar = m_scenes.get_object_by_name("AnwarFactory_rig");
  walkie_2 = m_scenes.get_object_by_name("ArmatureWalkieTalkie.001");
  screwdriver_1 = m_scenes.get_object_by_name("Screwdriver_Rig.002");
  screwdriver_2 = m_scenes.get_object_by_name("Screwdriver_Rig.003");
  wrench_1 = m_scenes.get_object_by_name("Wrench_Rig.003");
  wrench_2 = m_scenes.get_object_by_name("Wrench_Rig.004");
  motor = m_scenes.get_object_by_name("Motor_Rig");
}

exports.anwar_idle = function() {
  event_sys.dispatch_event("anim_start",
    {id: exports.ANIM_ANWAR_IDLE, obj: anwar, slot_num: 0});
  m_anim.apply(anwar,"Anwar_Factory_q5_Idle_B4W_BAKED");
  m_anim.set_behavior(anwar, m_anim.AB_CYCLIC);
  m_anim.play(anwar);
}

exports.anwar_notify_personnel = function() {
  event_sys.dispatch_event("anim_start",
    {id: exports.ANIM_ANWAR_NOTIFY_PERSONNEL, obj: anwar, slot_num: 0});
  m_anim.apply(anwar, "Anwar_Factory_notifyPersonnel_B4W_BAKED");
  m_anim.apply(walkie_2, "Anwar_Factory_WalkieMove_X");
  m_anim.set_behavior(anwar, m_anim.AB_FINISH_STOP);
  m_anim.set_behavior(walkie_2, m_anim.AB_FINISH_STOP);
  m_anim.play(anwar, mk_finish_cb(exports.ANIM_ANWAR_NOTIFY_PERSONNEL));
  m_anim.play(walkie_2);
}

exports.anwar_tools_away = function() {
  event_sys.dispatch_event("anim_start",
    {id: exports.ANIM_ANWAR_TOOLS_AWAY, obj: anwar, slot_num: 0});
  m_anim.apply(anwar, "Anwar_Factory_ToolsAway_B4W_BAKED");
  m_anim.apply(screwdriver_1, "Anwar_Factory_Tools_ScrewdriverBase_X_B4W_BAKED");
  m_anim.apply(screwdriver_2, "Anwar_Factory_Tools_ScrewdriverMove_Y_B4W_BAKED");
  m_anim.apply(wrench_1, "Anwar_Factory_Tools_WrenchBase_X_B4W_BAKED");
  m_anim.apply(wrench_2, "Anwar_Factory_Tools_WrenchMove_Y_B4W_BAKED");
  m_anim.set_behavior(anwar, m_anim.AB_FINISH_STOP);
  m_anim.set_behavior(screwdriver_1, m_anim.AB_FINISH_STOP);
  m_anim.set_behavior(screwdriver_2, m_anim.AB_FINISH_STOP);
  m_anim.set_behavior(wrench_1, m_anim.AB_FINISH_STOP);
  m_anim.set_behavior(wrench_2, m_anim.AB_FINISH_STOP);
  m_anim.play(anwar, mk_finish_cb(exports.ANIM_ANWAR_TOOLS_AWAY));
  m_anim.play(screwdriver_1);
  m_anim.play(screwdriver_2);
  m_anim.play(wrench_1);
  m_anim.play(wrench_2);
}

exports.anwar_guards_away = function() {
  event_sys.dispatch_event("anim_start",
    {id: exports.ANIM_ANWAR_GUARDS_AWAY, obj: anwar, slot_num: 0});
  m_anim.apply(anwar, "Anwar_Factory_GuardsAway_B4W_BAKED");
  m_anim.apply(motor, "Anwar_Factory_GuardAttach_X");
  m_anim.set_behavior(anwar, m_anim.AB_FINISH_STOP);
  m_anim.set_behavior(motor, m_anim.AB_FINISH_STOP);
  m_anim.play(anwar, mk_finish_cb(exports.ANIM_ANWAR_GUARDS_AWAY));
  m_anim.play(motor);
}

exports.anwar_idle2 = function() {
  event_sys.dispatch_event("anim_start",
    {id: exports.ANIM_ANWAR_IDLE2, obj: anwar, slot_num: 0});
  m_anim.apply(anwar,"Anwar_Factory_q5_lastIdle_B4W_BAKED");
  m_anim.set_behavior(anwar, m_anim.AB_CYCLIC);
  m_anim.play(anwar);
}

exports.anwar_isolation_motor = function() {
  event_sys.dispatch_event("anim_start",
    {id: exports.ANIM_ANWAR_ISOLATOR_TAG, obj: anwar, slot_num: 0});
  m_anim.apply(anwar, "Anwar_Factory_q5_newAttach");
  m_anim.set_behavior(anwar, m_anim.AB_FINISH_STOP);
  m_anim.play(anwar, mk_finish_cb(exports.ANIM_ANWAR_ISOLATOR_TAG));
}

});