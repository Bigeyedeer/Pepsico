"use strict"

// register the application module
b4w.register("section_04_p1", function(exports, require) {

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
var m_lights      = require("lights");
var m_notifications = require("notifications");
var m_scene_mouse = require("scene_mouse");
var course        = parent.course;

var start_camera_pivot;
var start_camera_trans;
var manage_camera_controls = false;

var mark_offset;
var submitted = false;
var charTom;
var charChair;
var charKeys;

var s04q01_again = new Audio('audio/s04q01_again.mp3');
var s04q01_answer = new Audio('audio/s04q01_answer.mp3');
var s04q01_question = new Audio('audio/s04q01_question.mp3');
var s04q01_no = new Audio('audio/s04q01_no.mp3');
var s04q01_excellent = new Audio('audio/s04q01_excellent.mp3');

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
    name: "mod_1_sec_4_p1",
    icon: "mod_1_sec_4",
    colour_scheme: "red",
    questions: 2
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
  m_data.load("mod_1_sec_4_p1.json", load_cb, function(percent, load_time) {
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
  m_notifications.setupIcons(3);
  charTom = m_scenes.get_object_by_name("Tom_Office");
  charChair = m_scenes.get_object_by_name("Chair_Armature");
  charKeys = m_scenes.get_object_by_name("Rig_Keys");

  m_animation.apply(charTom,"Tom_Evac_00IdleSit_B4W_BAKED");
  m_animation.set_behavior(charTom, m_animation.AB_CYCLIC);
  m_animation.play(charTom);

  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Mesh_Tom"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Office_Chair"), "pointer");

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
  m_cutscene.play_cutscene(container, ["video/section_04.mp4"], end_cutscene, buffer);//Set Outro here
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
      window.location = "../mod_1_sec_4_p2/index.html";
  },1500);
}

var dragObj = null;
var objName;
var objPar;

function on_mouse_down(e) {
  dragObj = m_scenes.pick_object(e.clientX, e.clientY);
  objName = m_scenes.get_object_name(dragObj);
  console.log (dragObj);
}

function on_mouse_up(e) {
  if (dragObj != null){
    if (submitted == false){
      if (objName.substring(0,4) == "icon"){
        UIhint.play();
        submitted = true;
// m_scene_mouse.disable_cursor_hover();
        objPar = m_scenes.get_object_name(m_objects.get_parent(m_objects.get_parent(dragObj)));
        var iconNum = objPar.substring(11,12);
        m_notifications.animateIcon(iconNum,"Icon_Click_X_B4W_BAKED");
        GetHint();
      } else {
        UIclick.play();
        if (m_quiz.index() == 0 && (objName != "exit" && objName != "staff")){
          m_quiz.check_question();
          submitted = true;
// m_scene_mouse.disable_cursor_hover();
        } else if (m_quiz.index() == 1 && (objName == "exit" || objName == "staff")){
          m_quiz.check_question();
          submitted = true;
// m_scene_mouse.disable_cursor_hover();
        }
      }
    }
  }
}

//******************************
//QUESTIONS
//******************************
var UIalarm = new Audio('../shared/audio/Aus_Alarm_Tone.mp3');
var UIevac = new Audio('../shared/audio/Aus_Evac_Tone.mp3');

function start_quiz() {
  var question_box = document.getElementById("question_box");
  var question_text = document.getElementById("question_text");

  m_quiz.add_question({
    set_up: function() {

      UIalarm.addEventListener('ended', function() {
          UIevac.play();
          UIevac.volume = 0.2;
      });
      UIevac.addEventListener('ended', function() {
          this.currentTime = 0;
          this.play();
      }, false);

      m_trans.set_scale(m_notifications.getIcon(0),0);
      m_trans.set_scale(m_notifications.getIcon(2),0);

      setTimeout(function() {
        m_scenes.apply_outline_anim_def(m_scenes.get_object_by_name("Mesh_Tom"));
      }, 1000);

      setTimeout(function(){
        UIalarm.play();
        UIalarm.volume = 0.2;

        m_lights.set_light_params (m_scenes.get_object_by_name("Spot"),{light_energy: 0});
        m_lights.set_light_params (m_scenes.get_object_by_name("Hemi"),{light_energy: 0.2});
        m_lights.set_light_params (m_scenes.get_object_by_name("alarm_1"),{light_energy: 5});
        m_lights.set_light_params (m_scenes.get_object_by_name("alarm_2"),{light_energy: 5});
      },500);

      question_box.style.display = "block";
      setTimeout(function() {
        s04q01_question.play();
      }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>Right, Tom. That's the alarm. What do you do first?</strong>";
        //==============================================
      $('.balance-text').balanceText();
      m_notifications.setIcon(3,"alert",null,null);
      setTimeout(function() {
        m_notifications.animateIcon("all","Icon_Intro_X_B4W_BAKED");
        m_trans.set_scale(m_notifications.getIcon(0),0);
        m_trans.set_scale(m_notifications.getIcon(2),0);
      }, 1000);
    },
    check: function() {
      var validationData = ValidateQuestion(1);
      setTimeout(function() {
        s04q01_excellent.play();
      }, 500);
      question_text.innerHTML =
      //==============================================
      "<strong>Excellent</strong>";
      //==============================================
      $('.balance-text').balanceText();
      m_animation.apply(charChair,"evac_01_chair_B4W_BAKED");
      m_animation.set_behavior(charChair, m_animation.AB_FINISH_STOP);
      m_animation.play(charChair);
      m_animation.apply(charKeys,"Keys_Evac_01TakeKeys_B4W_BAKED");
      m_animation.set_behavior(charKeys, m_animation.AB_FINISH_STOP);
      m_animation.play(charKeys);
      m_animation.apply(charTom,"Tom_Evac_01Getup_B4W_BAKED");
      m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
      m_animation.play(charTom, function(){
        m_animation.apply(charTom,"Tom_Evac_02Idle_B4W_BAKED");
        m_animation.set_behavior(charTom, m_animation.AB_CYCLIC);
        m_animation.play(charTom);
      });
      m_notifications.setIcon(1,"check",null,null);
      return validationData[0];
    }
  });

  m_quiz.add_question({
    set_up: function() {
      m_scenes.clear_outline_anim(m_scenes.get_object_by_name("Mesh_Tom"));
      setTimeout(function() {
        m_scenes.apply_outline_anim_def(m_scenes.get_object_by_name("staff"));
        setTimeout(function() {
          m_scenes.apply_outline_anim_def(m_scenes.get_object_by_name("exit"));
        }, 1000);
      }, 1000);

      m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("staff"), "pointer");
      m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("exit"), "pointer");
      m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Mesh_Tom"), "default");
      m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Office_Chair"), "default");
      question_box.style.display = "block";
      setTimeout(function() {
        s04q01_question.play();
      }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>Right, Tom. What do you do next?</strong>";
        //==============================================
      $('.balance-text').balanceText();
      setTimeout(function() {
        m_notifications.animateIcon("all","Icon_Intro_X_B4W_BAKED");
        m_trans.set_scale(m_notifications.getIcon(1),0);
      }, 1000);
      document.getElementById('question_tap_tooltip').style.display = "none";
      question_box.style.cursor = 'default';
      question_box.style.paddingBottom = '0px';
    },
    check: function() {
      var validationData = ValidateQuestion(2);
      switch (validationData[1]){
        case "staff":
          setTimeout(function() {
        s04q01_again.play();
      }, 500);
          question_text.innerHTML =
          //==============================================
          "<strong>This isn't correct. Try again.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(0,"cross",null,null);
          break;
        case "exit":
          setTimeout(function() {
        s04q01_answer.play();
      }, 500);
          question_text.innerHTML =
          //==============================================
          "<strong>Yes. Ok. Let's go.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_animation.apply(charTom,"Tom_Evac_03WalkOff_B4W_BAKED");
          m_animation.set_behavior(charTom, m_animation.AB_FINISH_STOP);
          m_animation.play(charTom);
          m_notifications.setIcon(2,"check",null,null);
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
  function ValidateQuestion(questionNum) {
    switch (questionNum){
      case 1:
        switch (objName){
        case "Mesh_Tom":
        case "Office_Chair":
            return [true, objName];
          break;
        }
      break;
      case 2:
        switch (objName){
        case "staff":
            return [false, objName];
          break;
        case "exit":
            return [true, objName];
          break;
        }
      break;
    }
  }

//******************************
//HINT
//******************************

  function GetHint(){
    switch (m_scenes.get_object_name(m_objects.get_parent(m_objects.get_parent(dragObj)))){
    case "noti_icons_0":
      GiveHint("<strong>Visit the staff room for a light snack.</strong>",1000,true);
      break;
    case "noti_icons_1":
      GiveHint("<strong>Get up and check that you have your valuables before evacuating.</strong>",2000,true);
      break;
    case "noti_icons_2":
      GiveHint("<strong>Move quickly to the nearest exit.</strong>",1000,true);
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
            m_quiz.next_question();
            submitted = false;
            question_box.style.borderColor = oldBorderCol;
            question_box.style.color = oldBorderCol;

// m_scene_mouse.enable_cursor_hover();
          }, 1000);
          m_notifications.animateIcon("all","Icon_Outro_X_B4W_BAKED");
        }, 3000);
    }
    else {
      UIwrong.play();
      question_box.style.animationName  = 'null';
      setTimeout(function() {
        mark.className = "question_active mark_wrong";
        question_box.style.animationDuration  = '0.3s';
        question_box.style.animationName  = 'shake';
        setTimeout(function() {
          question_box.style.animationName  = 'null';
          submitted = false;
// m_scene_mouse.enable_cursor_hover();
        }, 400);
      }, 10);

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
b4w.require("section_04_p1").init();
