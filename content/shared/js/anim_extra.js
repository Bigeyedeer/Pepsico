"use strict"

b4w.register("anim_extra", function(exports, require) {

exports.PINGPONG = "PINGPONG"

var m_anim = require("animation");
var m_events = require("events");

var ANIM_MODES = [m_anim.AB_CYCLIC, m_anim.AB_FINISH_STOP, m_anim.AB_FINISH_RESET, exports.PINGPONG];

function pingpong(obj, loop, callback, slot) {
  slot = typeof slot !== 'undefined' ? slot : 0;
  loop = typeof loop !== 'undefined' ? loop : true;
  var backwards = function() {
    m_anim.set_behavior(obj, m_anim.AB_FINISH_STOP, slot);
    m_anim.set_speed(obj, -1.0, slot);
    m_anim.play(obj, loop ? forwards : callback, slot);
  };
  var forwards = function() {
    m_anim.set_behavior(obj, m_anim.AB_FINISH_STOP, slot);
    m_anim.set_speed(obj, 1.0, slot);
    m_anim.play(obj, backwards, slot);
  };
  forwards();
}

exports.play_anim = function(obj, anim_name, speed, mode, callback) {
  if (speed == undefined)
    speed = 1;
  exports.create_anim(obj, anim_name, speed, mode)(callback);
}

exports.create_anim = function(obj, anim_name, speed, mode) {
  if (speed == undefined)
    speed = 1;
  return function(callback) {
    if (ANIM_MODES.indexOf(mode) == -1)
      mode = m_anim.AB_FINISH_STOP;
    m_anim.apply(obj, anim_name);
    if (mode === exports.PINGPONG) {
      pingpong(obj, false, callback);
    }
    else {
      m_anim.set_behavior(obj, mode);
      if (speed < 0)
        m_anim.set_last_frame(obj);
      m_anim.set_speed(obj, speed);
      m_anim.play(obj, callback);
    }
  }
}

exports.combine = function() {
  var anims = arguments;
  return function(callback) {
    var is_done = [];

    function callback_on_last() {
      if (is_done.indexOf(false) == -1 && callback) {
        callback();
      }
    }

    function set_done(index) {
      return function() {
        is_done[index] = true;
        callback_on_last();
      }
    }

    for (var i = 0; i < anims.length; i++) {
      is_done[i] = false;
      anims[i](set_done(i));
    }
  }
}

exports.AnimationQueue = function(auto_play) {
  var self = this;
  var state = "idle";
  var queue = [];
  var event_sys = new m_events.EventSystem(["empty"]);

  if (auto_play === undefined)
    auto_play = true;

  self.add_listener = event_sys.add_listener;
  self.remove_listener = event_sys.remove_listener;

  self.play = function() {
    if (state == "playing")
      return;
    state = "playing";
    play_next();
  }

  self.add = function(anim) {
    queue.push(anim);
    if (auto_play)
      self.play();
  }

  self.get_state = function() {
    return state;
  }

  function play_next() {
    var anim = queue.shift();
    if (anim === undefined) {
      state = "idle";
      event_sys.dispatch_event("empty");
      return;
    }
    anim(play_next);
  }
}

});
