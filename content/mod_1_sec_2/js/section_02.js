"use strict"

// register the application module
b4w.register("section_02", function(exports, require) {

// import modules used by the app
var m_scene_info  = require("scene_info");
var m_game_ui     = require("game_ui");
var m_line_speed  = require("line_speed");
var m_app         = require("app");
var m_camera      = require("camera");
var m_cfg         = require("config");
var m_cutscene    = require("cutscene");
var m_data        = require("data");
var m_events      = require("events");
var m_main        = require("main");
var m_container   = require("container");
var m_quiz        = require("quiz");
var m_scenes      = require("scenes");
var m_trans       = require("transform");
var m_constrain   = require("constraints");
var m_vec3        = require("vec3");
var m_animation   = require("animation");
var m_objects     = require("objects");
var m_notifications = require("notifications");
var m_geometry    = require("geometry");
var m_scene_mouse = require("scene_mouse");
var course        = parent.course;

var ITEM_NAMES = ["Back"];

var start_camera_pivot;
var start_camera_trans;
var manage_camera_controls = false;

var mark_offset;
var submitted = false;
var charTom;
var charBox;
var sliderBackCtrl;
var sliderKneesCtrl;

var s02q02_answer = new Audio('audio/s02q02_answer.mp3');
var s02q01_notfirst = new Audio('audio/s02q01_notfirst.mp3');
var s02q01_question = new Audio('audio/s02q01_question.mp3');
var s02q02_question = new Audio('audio/s02q02_question.mp3');

//UI Sounds
var UIclick = new Audio('../shared/audio/Click_Tap.mp3');
var UIcorrect = new Audio('../shared/audio/Correct.mp3');
var UIwrong = new Audio('../shared/audio/Wrong.mp3');
var UIhint = new Audio('../shared/audio/Hint.mp3');

// Some code borrowed from stackoverflow.com by BrunoLM.
var qs = (function(a) {
  if (a == "") return {};
  var b = {};
  for (var i = 0; i < a.length; ++i)
  {
    var p=a[i].split('=', 2);
    if (p.length == 1)
      b[p[0]] = "";
    else
      b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
  }
  return b;
})(window.location.search.substr(1).split('&'));

/**
 * export the method to initialize the app (called at the bottom of this file)
 */
exports.init = function() {
  m_scene_info.init({
    name: "mod_1_sec_2",
    icon: "mod_1_sec_2",
    colour_scheme: "light_blue",
    questions: 1
  });
  m_game_ui.init();
  m_game_ui.play_cutscene = play_cutscene;
  set_quality();
  m_cfg.set("physics_enabled", false);
  m_app.init({
    canvas_container_id: "main_canvas_container",
    callback: init_cb,
    show_fps: false,
    autoresize: true
   });
}

exports.manage_camera_controls = function(state) {
  manage_camera_controls = state;
}

function set_quality() {
  if (!qs["quality"])
    return;
  switch (qs["quality"].toLowerCase()) {
  case "low": m_cfg.set("quality", m_cfg.P_LOW); break;
  case "high": m_cfg.set("quality", m_cfg.P_HIGH); break;
  case "ultra": m_cfg.set("quality", m_cfg.P_ULTRA); break;
  }
}

/**
 * callback executed when the app is initizalized
 */
function init_cb(canvas_elem, success) {

  if (!success) {
    return;
  }

  load();
}

/**
 * load the scene data
 */
function load() {
  m_data.load("mod_1_sec_2.json", load_cb, function(percent, load_time) {
    m_line_speed.recalc_speed(percent, load_time);
    m_game_ui.update_load_screen(percent, load_time);
  });
}

/**
 * callback executed when the scene is loaded
 */
function load_cb(data_id) {
  m_game_ui.close_load_screen(true);
  m_app.enable_controls();
  m_app.enable_camera_controls();

  // place your code here
  m_notifications.setupIcons(1);

  charTom = m_scenes.get_object_by_name("Tom_Office");
  m_animation.apply(charTom,"Tom_BadIdle_Loop_B4W_BAKED");
  m_animation.set_behavior(charTom, m_animation.AB_CYCLIC);
  m_animation.play(charTom);
  charBox = m_scenes.get_object_by_name("Box_Rig_01");
  m_animation.set_first_frame(charBox);

  //SLIDERS
  sliderBackCtrl = m_scenes.get_object_by_name("sliderBackCtrl");
  sliderKneesCtrl = m_scenes.get_object_by_name("sliderKneesCtrl");

  //Cursors
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Back_ctrl"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Knee_ctrl"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Box_01"), "pointer");

  var canvas = m_container.get_canvas();
  canvas.addEventListener("mousedown", on_mouse_down);
  canvas.addEventListener("mouseup", on_mouse_up);

  m_line_speed.freeze();
  if (qs["skip_intro"] == "1")
    end_cutscene();
  else
    play_cutscene(true);
}

function play_cutscene(buffer) {
  m_main.pause();
  m_game_ui.set_game_hidden(true);
  var container = document.getElementById("cutscene_container");
  m_cutscene.play_cutscene(container, ["video/section_02.mp4"], end_cutscene, buffer);
}

function end_cutscene() {
  if (m_main.is_paused())
    m_main.resume();
  m_game_ui.set_game_hidden(false);
  document.getElementById('mod_header').style.animationPlayState = 'running';
  document.getElementById('quiz_wrapper').style.display = 'block';
  start_quiz();
}

function end_quiz() {
  question_box.style.display = "none";
  $('#fade').css({ 'background-color': 'rgba(0, 0, 0, 1)' });
  document.getElementById("fade").style.zIndex = "10";
  setTimeout(function() {
    if (course)
      course.finish_active_section();
    else
      window.location = "../mod_1_sec_3/index.html";
  },1500);
}

function setIdle(name){
  return function() {
    m_animation.apply(charTom, name);
    m_animation.set_behavior(charTom, m_animation.AB_CYCLIC);
    m_animation.play(charTom);
  }
}

var mouseOffset = 0;
var dragObj = null;
var dragging = false;
var objName;
var objPar;
var knee = false;
var back = false;

function on_mouse_down(e) {
  dragObj = m_scenes.pick_object(e.clientX, e.clientY);
  if (dragObj == null)
    return;
  if (m_scenes.get_object_name(dragObj) == "Knee_ctrl" || m_scenes.get_object_name(dragObj) == "Back_ctrl"){
    UIclick.play();
    dragging = true;
    mouseOffset = [e.clientX,e.clientY];
    m_app.disable_camera_controls();
  } else {
    UIclick.play();
  }
}

function on_mouse_up(e) {
  if (dragging == true){
      //KNEES
    if (m_scenes.get_object_name(dragObj) == "Knee_ctrl"){
      knee = !knee;
      console.log(knee);
      switch (knee){
        case true:
          m_geometry.set_shape_key_value(dragObj, "Right/Left", 1);
        break;
        case false:
          m_geometry.set_shape_key_value(dragObj, "Right/Left", 0);
        break;
      }
      if (knee == true){
        if (back == true){ //Good Back Good Knees
          if (m_animation.get_current_anim_name(charTom) != "Tom_Bentknee_GoodIdle_Loop_B4W_BAKED"){
            m_animation.apply(charTom,"Tom_Box_Straightback_Kneel_B4W_BAKED");
            m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
            m_animation.play(charTom,function(){
              m_animation.apply(charTom,"Tom_Bentknee_GoodIdle_Loop_B4W_BAKED");
              m_animation.set_behavior(charTom, m_animation.AB_CYCLIC);
              m_animation.play(charTom,null);
            });
          }
        } else { //Bad Back Good Knees
          if (m_animation.get_current_anim_name(charTom) != "Tom_Bentknee_BadIdle_Loop_B4W_BAKED"){
            m_animation.apply(charTom,"Tom_Box_Badback_Kneel_B4W_BAKED");
            m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
            m_animation.play(charTom,function(){
              m_animation.apply(charTom,"Tom_Bentknee_BadIdle_Loop_B4W_BAKED");
              m_animation.set_behavior(charTom, m_animation.AB_CYCLIC);
              m_animation.play(charTom,null);
            });
          }
        }
      } else {
        if (back == true){ //Good Back Bad Knees
          if (m_animation.get_current_anim_name(charTom) != "Tom_GoodIdle_Loop_B4W_BAKED"){
            m_animation.apply(charTom,"Tom_Box_Straightback_Kneel_B4W_BAKED");
            m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
            m_animation.set_speed(charTom,-1.0);
            m_animation.set_last_frame(charTom);
            m_animation.play(charTom,function(){
              m_animation.apply(charTom,"Tom_GoodIdle_Loop_B4W_BAKED");
              m_animation.set_behavior(charTom, m_animation.AB_CYCLIC);
              m_animation.play(charTom,null);
            });
          }
        } else { //Bad Back Bad Knees
          if (m_animation.get_current_anim_name(charTom) != "Tom_BadIdle_Loop_B4W_BAKED"){
            m_animation.apply(charTom,"Tom_Box_Badback_Kneel_B4W_BAKED");
            m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
            m_animation.set_speed(charTom,-1.0);
            m_animation.set_last_frame(charTom);
            m_animation.play(charTom,function(){
              m_animation.apply(charTom,"Tom_BadIdle_Loop_B4W_BAKED");
              m_animation.set_behavior(charTom, m_animation.AB_CYCLIC);
              m_animation.play(charTom,null);
            });
          }
        }
      }

      //BACK
    } else if (m_scenes.get_object_name(dragObj) == "Back_ctrl"){
      back = !back;
      console.log(back);
      switch (back){
        case true:
          m_geometry.set_shape_key_value(dragObj, "Up/Down", 1);
        break;
        case false:
          m_geometry.set_shape_key_value(dragObj, "Up/Down", 0);
        break;
      }
      if (back == true){
        if (knee == true){ //Good Back Good Knees
          if (m_animation.get_current_anim_name(charTom) != "Tom_Bentknee_GoodIdle_Loop_B4W_BAKED"){
            m_animation.apply(charTom,"Tom_Box_Kneel_BadtoGood_B4W_BAKED");
            m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
            m_animation.play(charTom,function(){
              m_animation.apply(charTom,"Tom_Bentknee_GoodIdle_Loop_B4W_BAKED");
              m_animation.set_behavior(charTom, m_animation.AB_CYCLIC);
              m_animation.play(charTom,null);
            });
          }
        } else { //Good Back Bad Knees
          if (m_animation.get_current_anim_name(charTom) != "Tom_GoodIdle_Loop_B4W_BAKED"){
            m_animation.apply(charTom,"Tom_Box_Straightback_B4W_BAKED");
            m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
            m_animation.play(charTom,function(){
              m_animation.apply(charTom,"Tom_GoodIdle_Loop_B4W_BAKED");
              m_animation.set_behavior(charTom, m_animation.AB_CYCLIC);
              m_animation.play(charTom,null);
            });
          }
        }
      } else {
        if (knee == true){ //Bad Back Good Knees
          if (m_animation.get_current_anim_name(charTom) != "Tom_Bentknee_BadIdle_Loop_B4W_BAKED"){
            m_animation.apply(charTom,"Tom_Box_Kneel_BadtoGood_B4W_BAKED");
            m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
            m_animation.set_speed(charTom,-1.0);
            m_animation.set_last_frame(charTom);
            m_animation.play(charTom,function(){
              m_animation.apply(charTom,"Tom_Bentknee_BadIdle_Loop_B4W_BAKED");
              m_animation.set_behavior(charTom, m_animation.AB_CYCLIC);
              m_animation.play(charTom,null);
            });
          }
        } else { //Bad Back Bad Knees
          if (m_animation.get_current_anim_name(charTom) != "Tom_BadIdle_Loop_B4W_BAKED"){
            m_animation.apply(charTom,"Tom_Box_Straightback_B4W_BAKED");
            m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
            m_animation.set_speed(charTom,-1.0);
            m_animation.set_last_frame(charTom);
            m_animation.play(charTom,function(){
              m_animation.apply(charTom,"Tom_BadIdle_Loop_B4W_BAKED");
              m_animation.set_behavior(charTom, m_animation.AB_CYCLIC);
              m_animation.play(charTom,null);
            });
          }
        }
      }
    }

    dragging = false;
    dragObj = null;
    m_app.enable_camera_controls();
  } else if (submitted == false){
    objName = m_scenes.get_object_name(dragObj);
    if (dragObj != null){
      if ((objName.substring(0,4) == "icon")){
        submitted = true;
        objPar = m_scenes.get_object_name(m_objects.get_parent(m_objects.get_parent(dragObj)));
        var iconNum = objPar.substring(11,12);
        m_notifications.animateIcon(iconNum,"Icon_Click_X_B4W_BAKED");
        GetHint();
      } else if (dragObj == m_scenes.pick_object(e.clientX, e.clientY)){
          m_quiz.check_question();
          submitted = true;
      }
    }
  }
}

//******************************
//QUESTIONS
//******************************

function start_quiz() {
  var question_box = document.getElementById("question_box");
  var question_text = document.getElementById("question_text");

  question_box.style.cursor = 'default';
  question_box.style.paddingBottom = '0px';

  m_quiz.add_question({
    set_up: function() {
//      m_constrain.append_track(m_scenes.get_object_by_name("Knee_ctrl"),m_scenes.get_active_camera());
//      m_constrain.append_track(m_scenes.get_object_by_name("Back_ctrl"),m_scenes.get_active_camera());
      question_box.style.display = "block";
      setTimeout(function() {
        s02q01_question.play();
      }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>What's the first thing you need to do to lift the box?</strong>";
        //==============================================
      $('.balance-text').balanceText();
      m_notifications.setIcon(1,"alert",null,null);
      setTimeout(function() {
        m_notifications.animateIcon("all","Icon_Intro_X_B4W_BAKED");
      }, 1000);
    },
    check: function() {
      switch (ValidateQuestion()[0]){
        case false:
          if (ValidateQuestion()[1] != null){
            var animName = m_animation.get_current_anim_name(charTom);
            switch (ValidateQuestion()[1]){
              case "Back_ctrl":
                setTimeout(function() {
                    s02q02_question.play();
                  }, 500);
                question_text.innerHTML =
                //==============================================
                "<strong>Right. So you’re back is straight… What’s next?</strong>"; //If back is straight
                //==============================================
                $('.balance-text').balanceText();
                m_animation.apply(charTom,"Tom_Straightback_Badpickup_B4W_BAKED");
                m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
                m_animation.play(charTom,setIdle(animName));
//                waitForEnd();
                return false;
                break;
              case "Knee_ctrl":
                question_text.innerHTML =
                //==============================================
                "<strong>Right. So you’re knees are bent… What’s next?</strong>"; //If knees are bent
                //==============================================
                $('.balance-text').balanceText();
                m_animation.apply(charTom,"Tom_Box_Badpickup_B4W_BAKED");
                m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
                m_animation.play(charTom,function(){
                  m_animation.apply(charTom,"Tom_Box_Badback_Kneel_B4W_BAKED");
                  m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
                  m_animation.play(charTom, setIdle(animName));
                });
//                waitForEnd();
                return false;
                break;
            }
          } else {
            setTimeout(function() {
                    s02q01_notfirst.play();
                  }, 500);
            question_text.innerHTML =
            //==============================================
            "<strong>That’s not the first thing to do. Have another go.</strong>"; //Nothing is right
            //==============================================
            $('.balance-text').balanceText();
            m_animation.apply(charTom,"Tom_Badpickup_1_B4W_BAKED");
            m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
            m_animation.play(charTom,setIdle(animName));
//            waitForEnd();
            return false;
          }
          break;
        case true:
          setTimeout(function() {
                    s02q02_answer.play();
                  }, 500);
          question_text.innerHTML =
          //==============================================
          "<strong>You’ve got it! Now you need to hold the box at your chest and get close to the load.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_animation.apply(charTom,"Tom_Box_Pickup_B4W_BAKED");
          m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
          m_animation.play(charTom);
          m_animation.apply(charBox,"Box_Pickup_B4W_BAKED");
          m_animation.set_behavior(charBox, m_animation.AB_FINISH_STOP);
          m_animation.play(charBox);
          m_animation.apply(m_notifications.getIcon(0),"Box_Pickup_Noti_B4W_BAKED");
          m_animation.set_behavior(m_notifications.getIcon(0), m_animation.AB_FINISH_STOP);
          m_animation.play(m_notifications.getIcon(0));
//          waitForEnd();
          return true;
          break;
      }
    }
  });

  m_quiz.add_listener("end", end_quiz);
  m_quiz.add_listener("question_check", on_check_question);
  m_quiz.add_listener("question_start", on_start_question);
  m_quiz.start();
}

//******************************
//VALIDATE QUESTIONS
//******************************

  function ValidateQuestion() {
    var correct = 0;
    var correctName;
    if (back==true){ //z
      correct++;
      correctName = "Back_ctrl";
    }
    if (knee==true){ //z
      correct++;
      correctName = "Knee_ctrl";
    }
    switch(correct){
      case 0:
        return [false];
        break;
      case 1:
        return [false, correctName];
        break;
      case 2:
        return [true];
        break;
    }

  }

function GetHint(){
  GiveHint("<strong>Keep your back straight & bend your knees</strong>",3000,true);
}

function GiveHint(newText, timeOut, hint){
  UIhint.play();
  var oldText = question_text.innerHTML;
  question_box.style.animationDuration  = '0.5s';
    question_box.style.animationName  = 'bounce';
    //setTimeout(function() {
      question_box.style.cursor = 'default';
      if (hint == true){
        var oldBorderCol = question_box.style.borderColor;
        question_box.style.borderColor = '#FF6633';
        question_box.style.color = '#FF6633';
      }
      question_text.innerHTML =
      //==============================================
          newText;
      //==============================================
      $('.balance-text').balanceText();

      setTimeout(function() {
        question_box.style.animationDuration  = '0.5s';
        question_box.style.animationName  = 'fadeOut';

        setTimeout(function() {
          question_box.style.cursor = 'default';
          question_box.style.animationName  = 'pop';
          if (hint == true){
            question_box.style.borderColor = oldBorderCol;
            question_box.style.color = oldBorderCol;
          }
          question_text.innerHTML =
          //==============================================
              oldText;
          //==============================================
          //$('.balance-text').balanceText();
          submitted = false;
        }, 300);

      }, timeOut);

    //}, 500);
}

//******************************
//CHECK QUESTIONS
//******************************

function on_check_question(data) {
  if (submitted != true) {
    submitted = true;
    var mark = document.getElementById("mark_"+m_quiz.index());
    if (data.correct) {
      UIcorrect.play();
      m_notifications.setIcon(0,"check",null,null);
      mark.className = "question_active mark_right";
        question_box.style.animationDuration  = '0.5s';
        question_box.style.animationName  = 'pop_r';
        var oldBorderCol = question_box.style.borderColor;
        question_box.style.borderColor = '#009966';
        question_box.style.color = '#009966';
        setTimeout(function() {
          question_box.style.animationDuration  = '1s';
          question_box.style.animationName  = 'pop_out';
          setTimeout(function() {
            m_quiz.next_question();
            submitted = false;
            question_box.style.borderColor = oldBorderCol;
            question_box.style.color = oldBorderCol;
          }, 1000);
        }, 3000);
        setTimeout(function(){
          m_notifications.animateIcon("all","Icon_Outro_X_B4W_BAKED");
        }, 1000);
    }
    else {
      UIwrong.play();
      m_notifications.setIcon(0,"cross",null,null);
      mark.className = "question_active mark_wrong";
      question_box.style.animationDuration  = '0.3s';
      question_box.style.animationName  = 'shake';
      setTimeout(function() {
        question_box.style.animationName  = 'null';
        submitted = false;
      }, 400);
    }
  }
}

function on_start_question(index) {
  var bodyRect = document.body.getBoundingClientRect(),
  elemRect = document.getElementById("mark_"+index).getBoundingClientRect();
  mark_offset = -(elemRect.right - bodyRect.right)+15; //15px offset to align middle of mark
  question_box.style.right = mark_offset+"px";
  question_box.style.animationName  = 'pop';
  document.getElementById("mark_"+index).className = "question_active";
}

});

// import the app module and start the app by calling the init method
b4w.require("section_02").init();
