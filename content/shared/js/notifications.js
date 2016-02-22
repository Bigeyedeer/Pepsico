if (b4w.module_check("notifications"))
  throw "Could not create module 'notifications'";

b4w.register("notifications", function(exports, require) {

var m_events      = require("events");
var m_cam         = require("camera");
var m_main        = require("main");
var m_container   = require("container");
var m_app         = require("app");
var m_scenes      = require("scenes");
var m_trans       = require("transform");
var m_constrain   = require("constraints");
var m_vec3        = require("vec3");
var m_animation   = require("animation");
var m_objects     = require("objects");
var m_scene_mouse = require("scene_mouse");

  //=================================
  //Icons
  //=================================

var noti_icon = [];
var clickSound = new Audio('../shared/audio/Click_Tap.mp3');

exports.setupIcons = function(count){
  m_scene_mouse.set_up();
  for (var i=0;i<count;i++){
    noti_icon[i] = m_scenes.get_object_by_name("noti_icons_"+i);
    m_scene_mouse.set_hover_cursor(m_scenes.get_object_children(m_scenes.get_object_children(noti_icon[i])[0])[0], "pointer");
    m_scene_mouse.set_hover_cursor(m_scenes.get_object_children(m_scenes.get_object_children(noti_icon[i])[1])[0], "pointer");
    m_scene_mouse.set_hover_cursor(m_scenes.get_object_children(m_scenes.get_object_children(noti_icon[i])[2])[0], "pointer");
    m_trans.set_scale(noti_icon[i],0);
  }
}

exports.getIcon = function(num){
  return noti_icon[num];
}
exports.getIconLength = function(){
  return noti_icon.length;
}

exports.animateIcon = function(count,name){
  if (count == "all"){
    var icount = noti_icon.length;
    for (var i=0;i<icount;i++){
      m_animation.apply(noti_icon[i],name);
      m_animation.set_behavior(noti_icon[i], m_animation.AB_FINISH_STOP);
      if (name == "Icon_Intro_X_B4W_BAKED"){
        m_trans.set_scale(noti_icon[i],1);
        m_trans.set_scale(m_scenes.get_object_children(noti_icon[i])[0],1);
        m_animation.play(noti_icon[i], idle(i));
      } else {
        m_animation.play(noti_icon[i],function(){
          // m_trans.set_scale(noti_icon[i],0);
        });
      }
    }
  } else {
    //hover and click
    count = parseFloat(count);
    m_animation.apply(noti_icon[count],name);
    m_animation.set_behavior(noti_icon[count], m_animation.AB_FINISH_STOP);
    m_animation.play(noti_icon[count], idle(count));
    clickSound.play();
  }
}

function idle(count){
  return function() {
    m_animation.set_behavior(noti_icon[count], m_animation.AB_CYCLIC);
    m_animation.apply(noti_icon[count],"Icon_Idle_X_B4W_BAKED");
    m_animation.play(noti_icon[count]);
  }
}

//***
exports.setIconConstraint = function(num,constraint,height){
  if (constraint != null){
       m_constrain.append_copy_trans(noti_icon[num],m_scenes.get_object_by_name(constraint),m_vec3.set(0, height, 0, m_vec3.create()));
  }
}

exports.setIcon = function(num,type,constraint,height){
  // if (constraint != null){
  //      m_constrain.append_copy_trans(noti_icon[num],m_scenes.get_object_by_name(constraint),m_vec3.set(0, height, 0, m_vec3.create()));
  // }
  switch (type){
    case "alert":
      for (var i=0;i<num;i++){
        m_trans.set_scale(m_scenes.get_object_children(noti_icon[i])[0],1);
        m_trans.set_scale(m_scenes.get_object_children(noti_icon[i])[1],0);
        m_trans.set_scale(m_scenes.get_object_children(noti_icon[i])[2],0);
      }
      break;
    case "check":
      m_trans.set_scale(m_scenes.get_object_children(noti_icon[num])[0],0);
      m_trans.set_scale(m_scenes.get_object_children(noti_icon[num])[1],1);
      m_trans.set_scale(m_scenes.get_object_children(noti_icon[num])[2],0);
      break;
    case "cross":
      m_trans.set_scale(m_scenes.get_object_children(noti_icon[num])[0],0);
      m_trans.set_scale(m_scenes.get_object_children(noti_icon[num])[1],0);
      m_trans.set_scale(m_scenes.get_object_children(noti_icon[num])[2],1);
      break;
  }
}

});