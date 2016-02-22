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
    name: "mod_2_sec_3",
    icon: "mod_2",
    colour_scheme: "light_blue",
    questions: 4
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
  m_data.load("mod_2_sec_3.json", load_cb, function(percent, load_time) {
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

  charSwitch = m_scenes.get_object_by_name("Isolator_Switch");
  charLock = m_scenes.get_object_by_name("Padlock_Small.006");
  charAnwar = m_scenes.get_object_by_name("AnwarFactory_rig");
  m_animation.apply(charAnwar,"Anwar_Factory_Idle_Y_B4W_BAKED");
  m_animation.set_behavior(charAnwar, m_animation.AB_CYCLIC);
  m_animation.play(charAnwar);

  //Cursors
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Isolator_Motor"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Isolator_Motor.001"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Conveyor_Control"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Conveyor_Control.001"), "pointer");
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

function idleAnwar(){
  return function(){
    m_animation.apply(charAnwar,"Anwar_Factory_Idle_Y_B4W_BAKED");
    m_animation.set_behavior(charAnwar, m_animation.AB_CYCLIC);
    m_animation.play(charAnwar);
  }
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
  if (first){
    first = false;
    start_quiz();
  } else {
    setTimeout(function(){
      switch (correct){
        case 0:
          s03q02_question.play();
        break;
        case 1:
          s03q03_question.play();
        break;
        case 2:
          s03q04_question.play();
        break;
        case 3:
          s03q05_question.play();
        break;
      }
    },500);
  }
}

function end_quiz() {
  question_box.style.display = "none";
  $('#fade').css({ 'background-color': 'rgba(0, 0, 0, 1)' });
  document.getElementById("fade").style.zIndex = "10";
  setTimeout(function() {
    if (course)
      course.finish_active_section();
    else
      window.location.href = "../mod_2_sec_4/index.html";
  },1500);
}

var dragObj = null;
var objName;
var objPar;
var arSubmitted = ["blah","blah","blah","blah"];

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

//******************************
//QUESTIONS
//******************************

var s03q02_answer = new Audio('audio/s03q02_answer.mp3');
var s03q02_incorrect = new Audio('audio/s03q02_incorrect.mp3');
var s03q02_notfirst = new Audio('audio/s03q02_notfirst.mp3');
var s03q02_question = new Audio('audio/s03q02_question.mp3');
var s03q02_tryagain = new Audio('audio/s03q02_tryagain.mp3');
var s03q03_notneeded = new Audio('audio/s03q03_notneeded.mp3');
var s03q03_notsafe = new Audio('audio/s03q03_notsafe.mp3');
var s03q03_notsfirst = new Audio('audio/s03q03_notsfirst.mp3');
var s03q03_question = new Audio('audio/s03q03_question.mp3');
var s03q04_answer = new Audio('audio/s03q04_answer.mp3');
var s03q04_answer2 = new Audio('audio/s03q04_answer2.mp3');
var s03q04_notneeded = new Audio('audio/s03q04_notneeded.mp3');
var s03q04_notsafe = new Audio('audio/s03q04_notsafe.mp3');
var s03q04_question = new Audio('audio/s03q04_question.mp3');

var wait = 3000;
var wrong = 0;

function start_quiz() {

//==============================================
//QUESTION 1
//==============================================

  m_quiz.add_question({
    set_up: function() {
      // m_trans.set_scale(m_notifications.getIcon(0),1);
      // m_trans.set_scale(m_notifications.getIcon(1),1);
      // m_trans.set_scale(m_notifications.getIcon(2),1);
      // m_trans.set_scale(m_notifications.getIcon(3),1);
      question_box.style.display = "block";
      document.getElementById('question_tap_tooltip').style.display = 'none';
        question_box.style.cursor = 'default';
        question_box.style.paddingBottom = '0px';
      setTimeout(function() {
        s03q02_question.play();
      }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>You need to clean the Conveyor. To make sure the equipment is safe while you do this task, what do you do first?</strong>";
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
        case "Conveyor_Control":
        case "Conveyor_Control.001":
          setTimeout(function() {
        s03q02_incorrect.play();
      }, 500);
          //==============================================
          GiveHint("<strong>This isn’t correct. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(0,"cross",null,null);
          break;
        case "Isolator_Motor":
        case "Isolator_Motor.001":
          setTimeout(function() {
        s03q02_answer.play();
      }, 500);
          question_text.innerHTML =
          //==============================================
          "<strong>Great.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_animation.apply(charAnwar,"Anwar_Factory_Isolator_Off_Y_B4W_BAKED");
          m_animation.set_behavior(charAnwar, m_animation.AB_FINISH_STOP);
          m_animation.play(charAnwar, idleAnwar());
          m_animation.apply(charSwitch,"Isolator_SwitchTurnOff_X_B4W_BAKED");
          m_animation.set_behavior(charSwitch, m_animation.AB_FINISH_STOP);
          m_animation.play(charSwitch);
          m_notifications.setIcon(1,"check",null,null);
          break;
        case "OutOfService_Tag":
          setTimeout(function() {
        s03q02_incorrect.play();
      }, 500);
          //==============================================
          GiveHint("<strong>This isn’t correct. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(2,"cross",null,null);
          break;
        case "PersonalLockAndTag":
          setTimeout(function() {
        s03q02_notfirst.play();
      }, 500);
          //==============================================
          GiveHint("<strong>This isn’t the first thing to do. Try again.</strong>",2000,false);
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

//==============================================
//QUESTION 2
//==============================================

m_quiz.add_question({
    set_up: function() {

      wrong = 0;

      setTimeout(function() {
        s03q03_question.play();
      }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>Now that you’ve turned off the isolator at the motor, what do you do next? </strong>";
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
        case "Conveyor_Control":
        case "Conveyor_Control.001":
          setTimeout(function() {
        s03q03_notsafe.play();
      }, 500);
          //==============================================
          GiveHint("<strong>It’s still not safe to start work yet. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(0,"cross",null,null);
          break;
        case "Isolator_Motor":
        case "Isolator_Motor.001":
          setTimeout(function() {
          s03q03_notsfirst.play();
          }, 500);
          //==============================================
          GiveHint("<strong>There’s something else you need to do first. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(1,"cross",null,null);
          break;
        case "OutOfService_Tag":
          setTimeout(function() {
        s03q03_notneeded.play();
      }, 500);
          //==============================================
          GiveHint("<strong>This isn’t needed here. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(2,"cross",null,null);
          break;
        case "PersonalLockAndTag":
        setTimeout(function() {
        s03q02_answer.play();
      }, 500);
          question_text.innerHTML =
          //==============================================
          "<strong>Great.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_animation.apply(charAnwar,"Anwar_Factory_Isolator_LockTag_Y_B4W_BAKED");
          m_animation.set_behavior(charAnwar, m_animation.AB_FINISH_STOP);
          m_animation.play(charAnwar,idleAnwar());
          m_animation.apply(charLock,"Lock_Tag_Appear_X_B4W_BAKED");
          m_animation.set_behavior(charLock, m_animation.AB_FINISH_STOP);
          m_animation.play(charLock);
          m_notifications.setIcon(3,"check",null,null);
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

//==============================================
//QUESTION 3
//==============================================
m_quiz.add_question({
    set_up: function() {

      wrong = 0;

      setTimeout(function() {
        s03q04_question.play();
      }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>You’ve attached your lock and tag. What do you do next?</strong>";
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
        case "Conveyor_Control":
        case "Conveyor_Control.001":
          wait = 11000;
          setTimeout(function() {
            s03q04_answer.play();
            setTimeout(function() {
              s03q04_answer2.play();
            }, 5500);
          }, 500);

          question_text.innerHTML =
          //==============================================
          "<strong>Yes. You need to test to see that the isolation has worked by checking buttons and switches.<br/>You’ll then need to test the equipment by performing the appropriate test, or doing a visual inspection, before starting work.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_animation.apply(charAnwar,"Anwar_Factory_CheckDead_Y_B4W_BAKED");
          m_animation.set_behavior(charAnwar, m_animation.AB_FINISH_STOP);
          m_animation.play(charAnwar);
          m_notifications.setIcon(0,"check",null,null);
          break;
        case "Isolator_Motor":
        case "Isolator_Motor.001":
          wait = 0;
          setTimeout(function() {
        s03q04_notneeded.play();
      }, 500);
          //==============================================
          GiveHint("<strong>This isn’t needed here. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(1,"cross",null,null);
          break;
        case "OutOfService_Tag":
          wait = 0;
          setTimeout(function() {
        s03q04_notneeded.play();
      }, 500);
          //==============================================
          GiveHint("<strong>This isn’t needed here. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(2,"cross",null,null);
          break;
        case "PersonalLockAndTag":
          wait = 0;
          setTimeout(function() {
        s03q04_notsafe.play();
      }, 500);
          //==============================================
          GiveHint("<strong>It’s still not safe to start work yet. Try again.</strong>",2000,false);
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
  var correct = 0;
  function ValidateQuestion() {
    // var correctName;
    // var answer = false;
    var objName = m_scenes.get_object_name(dragObj);
    switch (objName){
    case "Conveyor_Control":
    case "Conveyor_Control.001":
        switch (correct){
          case 0:
          return [false, objName];
          break;
          case 1:
          return [false, objName];
          break;
          case 2:
          correct++;
          return [true, objName];
          break;
        }
      break;
    case "Isolator_Motor":
    case "Isolator_Motor.001":
        switch (correct){
          case 0:
          correct++;
          return [true, objName];
          break;
          case 1:
          return [false, objName];
          break;
          case 2:
          return [false, objName];
          break;
        }
      break;
    case "OutOfService_Tag":
        return [false, objName];
      break;
    case "PersonalLockAndTag":
        switch (correct){
          case 0:
          return [false, objName];
          break;
          case 1:
          correct++;
          return [true, objName];
          break;
          case 2:
          return [false, objName];
          break;
        }
      break;
    }
  }

//******************************
//HINT
//******************************

  function GetHint(){
    switch (correct){
          case 0: //QUESTION 1
          switch (objPar){
            case "noti_icons_0":
              GiveHint(
                "<strong>Turn the isolator off at the computer monitor</strong>",1500,true);
              break;
            case "noti_icons_1":
              GiveHint(
                "<strong>Turn the isolator off at the motor</strong>",1000,true);
              break;
            case "noti_icons_2":
              GiveHint(
                "<strong>Attach an Out Of Service Tag</strong>",1000,true);
              break;
            case "noti_icons_3":
              GiveHint(
                "<strong>Attach a personal lock and tag</strong>",1000,true);
              break;
            }
          break;
          case 1: //QUESTION 2
          switch (objPar){
            case "noti_icons_0":
              GiveHint(
                "<strong>Start work</strong>",500,true);
              break;
            case "noti_icons_1":
              GiveHint(
                "<strong>Check the isolation is effective</strong>",1250,true);
              break;
            case "noti_icons_2":
              GiveHint(
                "<strong>Attach an Information Tag</strong>",1000,true);
              break;
            case "noti_icons_3":
              GiveHint(
                "<strong>Attach a personal lock and tag and consider the use of a hasp.</strong>",2000,true);
              break;
            }
          break;
          case 2: //QUESTION 3
          switch (objPar){
            case "noti_icons_0":
              GiveHint(
                "<strong>Validate the isolation is effective – test for dead</strong>",1500,true);
              break;
            case "noti_icons_1":
              GiveHint(
                "<strong>Start work</strong>",500,true);
              break;
            case "noti_icons_2":
              GiveHint(
                "<strong>Attach an Out Of Service Tag</strong>",7500,true);
              break;
            case "noti_icons_3":
              GiveHint(
                "<strong>Attach an Information Tag</strong>",7500,true);
              break;
            }
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
        setTimeout(function() {
          wait = 3000;
          question_box.style.animationDuration  = '1s';
          question_box.style.animationName  = 'pop_out';
          setTimeout(function() {
            tooltip.style.display = 'none';
            question_box.style.cursor = 'default';
            question_box.style.animationName  = 'pop';
            if (correct == 3){
              question_box.style.animationName  = 'fadeOut';
            }
              m_quiz.next_question();
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
b4w.require("section_03").init();
