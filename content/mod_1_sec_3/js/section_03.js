"use strict"

// register the application module
b4w.register("section_03", function(exports, require) {

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
var m_lights      = require("lights");
var m_scene_mouse = require("scene_mouse");
var course        = parent.course;

var start_camera_pivot;
var start_camera_trans;
var manage_camera_controls = false;

var mark_offset;
var submitted = false;
var canClick = true;
var charSue;
var charPizza;
var charWater;

var s03q01_answer = new Audio('audio/s03q01_answer.mp3');
var s03q01_question = new Audio('audio/s03q01_question.mp3');
var s02q02_notright = new Audio('audio/s02q02_notright.mp3');

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
    name: "mod_1_sec_3",
    icon: "mod_1_sec_3",
    colour_scheme: "green",
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
    console_verbose: false,
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
    console.log("b4w init failure");
    return;
  }

  load();
}

/**
 * load the scene data
 */
function load() {
  m_data.load("mod_1_sec_3.json", load_cb, function(percent, load_time) {
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

  //m_cfg.set("enable_outlining",true);

  // place your code here
  m_notifications.setupIcons(4);
  charPizza = m_scenes.get_object_by_name("Pizza_Arm");
  charSue = m_scenes.get_object_by_name("Sue_Office");
  charWater = m_scenes.get_object_by_name("water_rig");
  m_animation.apply(charSue,"dmt_sue_idle_B4W_BAKED");
  m_animation.set_behavior(charSue, m_animation.AB_CYCLIC);
  m_animation.play(charSue);

  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Toaster"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Counter_Basin"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Pizza_Box"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Light_Switch"), "pointer");

  var canvas = m_container.get_canvas();
  canvas.addEventListener("mouseup", on_mouse_up);
  canvas.addEventListener("mousedown", on_mouse_down);

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
  m_cutscene.play_cutscene(container, ["video/section_03.mp4"], end_cutscene, buffer);
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
      window.location = "../mod_1_sec_4_p1/index.html";
  },1500);
}

var dragObj = null;
var objName;
var objPar;
var arSubmitted = ["blah","blah","blah","blah"];

function on_mouse_down(e) {
  dragObj = m_scenes.pick_object(e.clientX, e.clientY);
  if (dragObj != null)
    objName = m_scenes.get_object_name(dragObj);
}

function on_mouse_up(e) {
  if (dragObj != null){
    if (submitted == false){
      if (objName.substring(0,4) == "icon"){
        submitted = true;
        // m_scene_mouse.disable_cursor_hover();
        objPar = m_scenes.get_object_name(m_objects.get_parent(m_objects.get_parent(dragObj)));
        var iconNum = objPar.substring(11,12);
        m_notifications.animateIcon(iconNum,"Icon_Click_X_B4W_BAKED");
        GetHint();
      } else {
        UIclick.play();
        for (var i=0;i<4;i++){
          if (objName !== arSubmitted[i]){
            if (i==3){
              m_quiz.check_question();
              submitted = true;
              // m_scene_mouse.disable_cursor_hover();
            }
          } else {
            break;
          }
        }
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

  m_quiz.add_question({
    set_up: function() {
      question_box.style.display = "block";
        question_box.style.cursor = 'default';
        question_box.style.paddingBottom = '0px';
      setTimeout(function() {
        s03q01_question.play();
      }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>How can you help the environment in this situation?</strong>";
        //==============================================
      $('.balance-text').balanceText();
      m_notifications.setIcon(4,"alert",null,null);
      setTimeout(function() {
        m_notifications.animateIcon("all","Icon_Intro_X_B4W_BAKED");
      }, 1000);
    },
    check: function() {
      var validationData = ValidateQuestion();
      switch (validationData[1]){
        case "Toaster":
          setTimeout(function() {
            s02q02_notright.play();
          }, 500);
          question_text.innerHTML =
          //==============================================
          "<strong>Hmmm. Something’s not right, here. Try again.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_animation.apply(charSue,"dmt_sue_toast_X_B4W_BAKED");
          m_animation.set_behavior(charSue, m_animation.AB_FINISH_STOP);
          m_animation.play(charSue, function(){
            m_animation.apply(charSue,"dmt_sue_idle_B4W_BAKED");
            m_animation.set_behavior(charSue, m_animation.AB_CYCLIC);
            m_animation.play(charSue);
            submitted = false;
            // m_scene_mouse.enable_cursor_hover();
          });
          m_notifications.setIcon(0,"cross",null,null);
          break;
        case "Counter_Basin":
          setTimeout(function() {
            s03q01_answer.play();
          }, 500);
          question_text.innerHTML =
          //==============================================
          "<strong>Excellent. You need to save water.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_animation.apply(charWater,"water_off_B4W_BAKED");
          m_animation.set_behavior(charWater, m_animation.AB_FINISH_STOP);
          m_animation.play(charWater);
          m_animation.apply(charSue,"dmt_sue_tap_X_B4W_BAKED");
          m_animation.set_behavior(charSue, m_animation.AB_FINISH_STOP);
          m_animation.play(charSue, function(){
            m_animation.apply(charSue,"dmt_sue_idle_B4W_BAKED");
            m_animation.set_behavior(charSue, m_animation.AB_CYCLIC);
            m_animation.play(charSue);
            submitted = false;
            // m_scene_mouse.enable_cursor_hover();
          });
          m_notifications.setIcon(1,"check",null,null);
          break;
        case "Pizza_Box":
          setTimeout(function() {
            s03q01_answer.play();
          }, 500);
          question_text.innerHTML =
          //==============================================
          "<strong>Excellent. You need to use the recycling bins.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_animation.apply(charPizza,"Pizza_Box_X_B4W_BAKED");
          m_animation.set_behavior(charPizza, m_animation.AB_FINISH_STOP);
          m_animation.play(charPizza);
          // m_animation.apply(m_notifications.getIcon(2),"Pizza_Box_Noti_X_B4W_BAKED");
          // m_animation.set_behavior(m_notifications.getIcon(2), m_animation.AB_FINISH_STOP);
          // m_animation.play(m_notifications.getIcon(2));
          m_animation.apply(charSue,"dmt_sue_box_X_B4W_BAKED");
          m_animation.set_behavior(charSue, m_animation.AB_FINISH_STOP);
          m_animation.play(charSue, function(){
            m_animation.apply(charSue,"dmt_sue_idle_B4W_BAKED");
            m_animation.set_behavior(charSue, m_animation.AB_CYCLIC);
            m_animation.play(charSue);
            submitted = false;
            // m_scene_mouse.enable_cursor_hover();
          });
          m_notifications.setIcon(2,"check",null,null);
          break;
        case "Light_Switch":
          setTimeout(function() {
            s03q01_answer.play();
          }, 500);
          question_text.innerHTML =
          //==============================================
          "<strong>Excellent. You need to save energy whenever possible.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_animation.apply(charSue,"dmt_sue_light_X_B4W_BAKED");
          m_animation.set_behavior(charSue, m_animation.AB_FINISH_STOP);
          m_animation.play(charSue, function(){
            m_animation.apply(charSue,"dmt_sue_idle_B4W_BAKED");
            m_animation.set_behavior(charSue, m_animation.AB_CYCLIC);
            m_animation.play(charSue);
            submitted = false;
            // m_scene_mouse.enable_cursor_hover();
          });
          setTimeout(function(){
            m_lights.set_light_params(m_scenes.get_object_by_name("Spot"), {light_energy: 0});
            m_lights.set_light_params(m_scenes.get_object_by_name("Spot.001"), {light_energy: 0});
          }, 2550);
          m_notifications.setIcon(3,"check",null,null);
          break;
        }
      return validationData[0];
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
  var correct = 0;
  function ValidateQuestion() {
    var correctName;
    var answer = false;
    var objName = m_scenes.get_object_name(dragObj);
    switch (objName){
    case "Toaster":
        arSubmitted[0] = objName;
        answer = false;
        return [false, objName];
      break;
    case "Counter_Basin":
        arSubmitted[1] = objName;
        answer = true;
        correct++;
        return [true, objName];
      break;
    case "Pizza_Box":
        arSubmitted[2] = objName;
        answer = true;
        correct++;
        return [true, objName];
      break;
    case "Light_Switch":
        arSubmitted[3] = objName;
        answer = true;
        correct++;
        return [true, objName];
      break;
    }
  }

//******************************
//HINT
//******************************

  function GetHint(){
    UIhint.play();
    switch (m_scenes.get_object_name(m_objects.get_parent(m_objects.get_parent(dragObj)))){
    case "noti_icons_0":
      GiveHint("<strong>Will making toast really benefit the environment?</strong>",2500,true);
      break;
    case "noti_icons_1":
      GiveHint("<strong>You should be saving water.</strong>",2000,true);
      break;
    case "noti_icons_2":
      GiveHint("<strong>You should be recycling.</strong>",2000,true);
      break;
    case "noti_icons_3":
      GiveHint("<strong>You should switch off lights when you leave the room.</strong>",2500,true);
      break;
    }
  }

function GiveHint(newText, timeOut, hint){
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
m_scene_mouse.enable_cursor_hover();
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
    // m_scene_mouse.disable_cursor_hover();
    var mark = document.getElementById("mark_"+m_quiz.index());
    if (data.correct) {
      UIcorrect.play();
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
          question_box.style.animationName  = 'pop';
          question_text.innerHTML =
          //==============================================
          "<strong>How can you help the environment in this situation?</strong>";
          //==============================================
          $('.balance-text').balanceText();
          if (correct == 3){
            m_notifications.setIcon(0,"cross",null,null);
            question_box.style.display = 'none';
            question_box.style.borderColor = oldBorderCol;
            question_box.style.color = oldBorderCol;
            m_quiz.next_question();
            m_notifications.animateIcon("all","Icon_Outro_X_B4W_BAKED");
          }
        }, 1000);
      }, 3000);
    } else {
      UIwrong.play();
      mark.className = "question_active mark_wrong";
      question_box.style.animationDuration  = '0.3s';
      question_box.style.animationName  = 'shake';
      setTimeout(function() {
        question_box.style.animationName  = 'null';
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
b4w.require("section_03").init();
