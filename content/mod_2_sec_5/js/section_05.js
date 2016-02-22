"use strict"

// register the application module
b4w.register("section_05", function(exports, require) {

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
var m_notifications = require ("notifications");
var m_scene_mouse = require("scene_mouse");
var course        = parent.course;

var start_camera_pivot;
var start_camera_trans;
var manage_camera_controls = false;

var mark_offset;
var submitted = false;
var first = true;

var canClick = true;
var charAnwar;
var charSwitch;
var charLock;
var charLock2;

var question_box;
var question_text;

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
    name: "mod_2_sec_5",
    icon: "mod_2",
    colour_scheme: "light_blue",
    questions: 1
  });
  m_game_ui.init();
  m_game_ui.play_cutscene = play_cutscene;
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
  m_data.load("mod_2_sec_5.json", load_cb, function(percent, load_time) {
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
  m_scene_mouse.set_up();
  m_notifications.setupIcons(4);

  charLock2 = m_scenes.get_object_by_name("Padlock_OutOfService");
  charLock = m_scenes.get_object_by_name("Padlock_Small.006");
  charAnwar = m_scenes.get_object_by_name("AnwarFactory_rig");
  m_animation.apply(charAnwar,"Anwar_Factory_Idle_Y_B4W_BAKED");
  m_animation.set_behavior(charAnwar, m_animation.AB_CYCLIC);
  m_animation.play(charAnwar);

  //Cursors
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Isolator_Motor"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Isolator_Motor.001"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Walkie"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("PersonalLockAndTag"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("OutOfService_Tag"), "pointer");

  question_box = document.getElementById("question_box");
  question_text = document.getElementById("question_text");

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
  m_cutscene.play_cutscene(container, ["video/section_05.mp4"], end_cutscene, buffer);
}

function play_outro() {
  m_main.pause();
  m_game_ui.set_game_hidden(true);
  var container = document.getElementById("cutscene_container");
  m_cutscene.play_cutscene(container, ["video/section_06.mp4"], end_section);
}

function end_cutscene() {
  if (m_main.is_paused())
    m_main.resume();
  m_game_ui.set_game_hidden(false);
  document.getElementById('mod_header').style.animationPlayState = 'running';
  document.getElementById('quiz_wrapper').style.display = 'block';
  if (first){
    first = false;
    start_quiz();
  } else {
    setTimeout(function(){
      switch (correct){
        case 0:
          s05q08_question.play();
        break;
      }
    },500);
  }
}

function end_section() {
  $('#fade').css({ 'background-color': 'rgba(0, 0, 0, 1)' });
  document.getElementById("fade").style.zIndex = "10";
  if (course)
    course.finish_active_section();
}

function end_quiz() {
  question_box.style.display = "none";
}

var dragObj = null;
var objName;
var objPar;

function on_mouse_down(e) {
  dragObj = m_scenes.pick_object(e.clientX, e.clientY);
}

function on_mouse_up(e) {
  if (m_scenes.pick_object(e.clientX, e.clientY) == dragObj){
    if (submitted == false){
      console.log(dragObj);
      objName = m_scenes.get_object_name(dragObj);
      if (dragObj != null){
        if ((objName.substring(0,4) == "icon") && (canClick==true)){
          submitted = true;
          objPar = m_scenes.get_object_name(m_objects.get_parent(m_objects.get_parent(dragObj)));
          var iconNum = objPar.substring(11,12);
          m_notifications.animateIcon(iconNum,"Icon_Click_X_B4W_BAKED");
          GetHint();
        } else {
          UIclick.play();
          m_quiz.check_question();
          submitted = true;

          // for (var i=0;i<4;i++){
          //   if (objName != arSubmitted[i]){
          //     if (i==4){m_quiz.check_question()};
          //   } else {
          //     break;
          //   }
          // }
        }
      }
    }
  }
}

var wait = 3000;
var wrong = 0;

//******************************
//QUESTIONS
//******************************

var s05q08_answer = new Audio('audio/s05q08_answer.mp3');
var s05q08_notright = new Audio('audio/s05q08_notright.mp3');
var s05q08_question = new Audio('audio/s05q08_question.mp3');

function start_quiz() {

//==============================================
//QUESTION 1
//==============================================

  m_quiz.add_question({
    set_up: function() {
      question_box.style.display = "block";
      document.getElementById('question_tap_tooltip').style.display = 'none';
        question_box.style.cursor = 'default';
        question_box.style.paddingBottom = '0px';
      setTimeout(function() {
        s05q08_question.play();
      }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>If you finish your work shift before you are able to finish the work, what do you need to do?</strong>";
        //==============================================
      //$('.balance-text').balanceText();

      m_notifications.setIcon(4,"alert",null,null);
      setTimeout(function() {
        m_notifications.animateIcon("all","Icon_Intro_X_B4W_BAKED");
      }, 1000);

    },
    check: function() {
      var validationData = ValidateQuestion();
      switch (validationData[1]){ //check obj name
        case "Walkie":
          setTimeout(function() {
            s05q08_notright.play();
          }, 500);
          //==============================================
          GiveHint("<strong>This isn’t right. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(0,"cross",null,null);
          break;
        case "Isolator_Motor":
        case "Isolator_Motor.001":
          wait = 3500;
          setTimeout(function() {
            s05q08_notright.play();
          }, 500);
          //==============================================
          GiveHint("<strong>This isn’t right. Try again. </strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(1,"cross",null,null);
          break;
        case "OutOfService_Tag":
          var anwar = m_scenes.get_object_by_name("AnwarFactory_rig");
          m_animation.apply(anwar, "Anwar_Factory_Isolator_LockTag.001_Y");
          m_animation.play(anwar);
          m_animation.apply(charLock,"Lock_Tag_Disappear_X_B4W_BAKED");
          m_animation.set_behavior(charLock, m_animation.AB_FINISH_STOP);
          m_animation.play(charLock);
          m_animation.apply(charLock2,"Out_Of_Service_TagAppear_X_B4W_BAKED");
          m_animation.set_behavior(charLock2, m_animation.AB_FINISH_STOP);
          m_animation.play(charLock2);
          setTimeout(function() {
            s05q08_answer.play();
          }, 500);
          setTimeout(function() {
            play_outro();
          }, 7000);
          question_text.innerHTML =
          //==============================================
          "<strong>Yes. That’s right. If you can’t finish the work you need to attach an Out of Service lock and tag and hand over the work to the next shift.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(2,"check",null,null);
          break;
        case "PersonalLockAndTag":
          setTimeout(function() {
            s05q08_notright.play();
          }, 500);
          //==============================================
          GiveHint("<strong>This isn’t right. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(3,"cross",null,null);
          break;
        }
      if (validationData[0] == false){
        wrong++;
        if (wrong == 3){
          setTimeout(function() {
            play_cutscene();
          },2500);
        }
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
  function ValidateQuestion() {
    // var correctName;
    // var answer = false;
    var objName = m_scenes.get_object_name(dragObj);
    switch (objName){
    case "Walkie":
      return [false, objName];
      break;
    case "Isolator_Motor":
    case "Isolator_Motor.001":
      return [false, objName];
      break;
    case "PersonalLockAndTag":
      return [false, objName];
      break;
    case "OutOfService_Tag":
      return [true, objName];
      break;
    }
  }

//******************************
//HINT
//******************************

  function GetHint(){
    switch (objPar){
      case "noti_icons_0":
        GiveHint(
          "<strong>Notify personnel in the area and confirm their safety</strong>",1500,true);
        break;
      case "noti_icons_1":
        GiveHint(
          "<strong>Restore energy</strong>",500,true);
        break;
      case "noti_icons_2":
        GiveHint(
          "<strong>Attach an out of service lock and tag</strong>",1000,true);
        break;
      case "noti_icons_3":
        GiveHint(
          "<strong>Remove locks and tags</strong>",700,true);
        break;
      }
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
    var mark = document.getElementById("mark_"+m_quiz.index());
    var tooltip = document.getElementById('question_tap_tooltip');
    if (data.correct) {
      UIcorrect.play();
        mark.className = "question_active mark_right";
        tooltip.style.display = 'none';
        question_box.style.cursor = 'default';
        question_box.style.paddingBottom = '0px';
        question_box.style.animationDuration  = '0.5s';
        question_box.style.animationName  = 'pop_r';
        var oldBorderCol = question_box.style.borderColor;
        question_box.style.borderColor = '#009966';
        question_box.style.color = '#009966';
        wait = 5000;
        setTimeout(function() {
          question_box.style.animationDuration  = '1s';
          question_box.style.animationName  = 'pop_out';
          setTimeout(function() {
            tooltip.style.display = 'none';
            question_box.style.cursor = 'default';
            question_box.style.animationName  = 'pop';
            m_quiz.next_question();
            question_box.style.animationName  = 'fadeOut';
            submitted = false;
            question_box.style.borderColor = oldBorderCol;
            question_box.style.color = oldBorderCol;
          }, 1000);
          m_notifications.animateIcon("all","Icon_Outro_X_B4W_BAKED");
        }, wait);
    }
    else {
      UIwrong.play();
      mark.className = "question_active mark_wrong";
      question_box.style.animationDuration  = '0.3s';
      question_box.style.animationName  = 'shake';
      setTimeout(function() {
        question_box.style.animationName  = 'null';
        submitted = false;
      }, 400);
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
b4w.require("section_05").init();
