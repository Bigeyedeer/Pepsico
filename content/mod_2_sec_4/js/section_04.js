"use strict"

// register the application module
b4w.register("section_04", function(exports, require) {

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
var m_scene_anim  = require("scene_anim");
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
    name: "mod_2_sec_4",
    icon: "mod_2",
    colour_scheme: "light_blue",
    questions: 3
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
  m_data.load("mod_2_sec_4.json", load_cb, function(percent, load_time) {
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

  m_scene_anim.set_up();
  m_scene_anim.add_listener("anim_finish", on_anim_finish);
  m_scene_anim.anwar_idle();

  charSwitch = m_scenes.get_object_by_name("Isolator_Switch");
  charLock = m_scenes.get_object_by_name("Padlock_Small.006");
  charAnwar = m_scenes.get_object_by_name("AnwarFactory_rig");

  //Cursors
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Motor_Gearbox_Lid"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Walkie"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Toolbox"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Isolator_Motor"), "pointer");

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
  m_cutscene.play_cutscene(container, ["video/section_04.mp4"], end_cutscene, buffer);
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
          s04q05_question.play();
        break;
        case 1:
          s04q06_question.play();
        break;
        case 2:
          s04q07_question.play();
        break;
      }
    },500);
  }
}

function on_anim_finish(anim) {
  switch(anim.id) {
    case m_scene_anim.ANIM_ANWAR_NOTIFY_PERSONNEL:
    case m_scene_anim.ANIM_ANWAR_TOOLS_AWAY:
      m_scene_anim.anwar_idle();
    break;
    case m_scene_anim.ANIM_ANWAR_GUARDS_AWAY:
      m_scene_anim.anwar_idle2();
    break;
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
      window.location.href = "../mod_2_sec_5/index.html";
  },1500);
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
      if (dragObj != null){
        console.log(dragObj);
        objName = m_scenes.get_object_name(dragObj);
        UIclick.play();
        if ((objName.substring(0,4) == "icon") && (canClick==true)){
          UIhint.play();
          submitted = true;
          objPar = m_scenes.get_object_name(m_objects.get_parent(m_objects.get_parent(dragObj)));
          var iconNum = objPar.substring(11,12);
          m_notifications.animateIcon(iconNum,"Icon_Click_X_B4W_BAKED");
          GetHint();
        } else {
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

var s04q05_answer = new Audio('audio/s04q05_answer.mp3');
var s04q05_notfirst = new Audio('audio/s04q05_notfirst.mp3');
var s04q05_question = new Audio('audio/s04q05_question.mp3');
var s04q06_answer = new Audio('audio/s04q06_answer.mp3');
var s04q06_else = new Audio('audio/s04q06_else.mp3');
var s04q06_question = new Audio('audio/s04q06_question.mp3');
var s04q07_answer = new Audio('audio/s04q07_answer.mp3');
var s04q07_notright = new Audio('audio/s04q07_notright.mp3');
var s04q07_question = new Audio('audio/s04q07_question.mp3');

function start_quiz() {

//==============================================
//QUESTION 1
//==============================================

  m_quiz.add_question({
    set_up: function() {

      setTimeout(function(){
        m_scenes.apply_outline_anim_def(m_scenes.get_object_by_name("Walkie"));
        setTimeout(function(){
          m_scenes.apply_outline_anim_def(m_scenes.get_object_by_name("Toolbox"));
          setTimeout(function(){
            m_scenes.apply_outline_anim_def(m_scenes.get_object_by_name("Motor_Gearbox_Lid"));
            setTimeout(function(){
              m_scenes.apply_outline_anim_def(m_scenes.get_object_by_name("Isolator_Motor"));
            },1000);
          },1000);
        },1000);
      },1000);

      question_box.style.display = "block";
      document.getElementById('question_tap_tooltip').style.display = 'none';
        question_box.style.cursor = 'default';
        question_box.style.paddingBottom = '0px';
      setTimeout(function() {
        s04q05_question.play();
      }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>Ok Anwar, you’ve finished working on the equipment. What do you do first?</strong>";
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
        case "Isolator_Motor":
          setTimeout(function() {
            s04q05_notfirst.play();
          }, 500);
          //==============================================
          GiveHint("<strong>There’s something else you need to do first. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(1,"cross",null,null);
          break;
        case "Walkie":
          m_scene_anim.anwar_notify_personnel();
          wait = 4000;
          setTimeout(function() {
            s04q05_answer.play();
          }, 500);
          question_text.innerHTML =
          //==============================================
          "<strong>Excellent. You need to let all personnel in the area know that you’ll be re-starting the equipment.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(0,"check",null,null);
          break;
        case "Motor_Gearbox_Lid":
          setTimeout(function() {
            s04q05_notfirst.play();
          }, 500);
          //==============================================
          GiveHint("<strong>There’s something else you need to do first. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(2,"cross",null,null);
          break;
        case "Toolbox":
          setTimeout(function() {
           s04q05_notfirst.play();
          }, 500);
          //==============================================
          GiveHint("<strong>There’s something else you need to do first. Try again.</strong>",2000,false);
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

      setTimeout(function(){
        m_notifications.animateIcon("all","Icon_Intro_X_B4W_BAKED");
      },1000);
      setTimeout(function() {
        s04q06_question.play();
      }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>Now that you’ve notified personnel in the area and confirmed their safety, what are the next two things you do?</strong>";
        //==============================================
      //$('.balance-text').balanceText();

      m_notifications.setIcon(4,"alert",null,null);

    },
    check: function() {
      var validationData = ValidateQuestion();
      switch (validationData[1]){ //check obj name
        case "Isolator_Motor":
          setTimeout(function() {
        s04q06_else.play();
      }, 500);
          //==============================================
          GiveHint("<strong>There’s something else you need to do first. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(1,"cross",null,null);
          break;

        case "Walkie":
          setTimeout(function() {
          s04q06_else.play();
          }, 500);
          //==============================================
          GiveHint("<strong>There’s something else you need to do first. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(0,"cross",null,null);
          break;

        case "Motor_Gearbox_Lid":
          m_scene_anim.anwar_guards_away();
          setTimeout(function() {
        s04q06_answer.play();
      }, 500);
//          if (q2Correct.length == 1){
//            GiveHint("<strong>Excellent. You need to reinstall guards.</strong>",2000,false);
//          } else {
          question_text.innerHTML ="<strong>Excellent. You need to reinstall guards.</strong>";
//          }
          $('.balance-text').balanceText();
          m_notifications.setIcon(2,"check",null,null);
          break;

        case "Toolbox":
          m_scene_anim.anwar_tools_away();
        setTimeout(function() {
        s04q06_answer.play();
      }, 500);
//          if (q2Correct.length == 1){
//            GiveHint("<strong>Excellent. You need to reinstall guards.</strong>",2000,false);
//          } else {
          question_text.innerHTML ="<strong>Excellent. You need to remove all tools.</strong>";
//          }
          $('.balance-text').balanceText();
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

      m_scenes.clear_outline_anim(m_scenes.get_object_by_name("Toolbox"));
      m_scenes.clear_outline_anim(m_scenes.get_object_by_name("Walkie"));
      m_scenes.clear_outline_anim(m_scenes.get_object_by_name("Motor_Gearbox_Lid"));
      m_scenes.clear_outline_anim(m_scenes.get_object_by_name("Isolator_Motor"));
      setTimeout(function(){
        m_scenes.apply_outline_anim_def(m_scenes.get_object_by_name("Walkie"));
        setTimeout(function(){
          m_scenes.apply_outline_anim_def(m_scenes.get_object_by_name("Conveyor_Control.001"));
          setTimeout(function(){
            m_scenes.apply_outline_anim_def(m_scenes.get_object_by_name("Motor_Gearbox_Lid"));
            setTimeout(function(){
              m_scenes.apply_outline_anim_def(m_scenes.get_object_by_name("Isolator_Motor"));
            },1000);
          },1000);
        },1000);
      },1000);

      setTimeout(function(){
        m_notifications.animateIcon("all","Icon_Intro_X_B4W_BAKED");
      },1000);
      //Translation is (x,y,z >> x,z,-y)
      m_trans.set_translation(m_notifications.getIcon(3), 0.3471, 0.99232, 0.45715);
      m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Toolbox"), "default");
      m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Conveyor_Control"), "pointer");
      m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Conveyor_Control.001"), "pointer");

      setTimeout(function() {
        s04q07_question.play();
      }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>Before you restart the equipment what is left to do?</strong>";
        //==============================================
      //$('.balance-text').balanceText();

      m_notifications.setIcon(4,"alert",null,null);

    },
    check: function() {
      var validationData = ValidateQuestion();
      switch (validationData[1]){ //check obj name
        case "Isolator_Motor":
          m_scene_anim.anwar_isolation_motor();
          console.log("ISOLATOR MOTOR ANIMATION GO!");
          wait = 6000;
          setTimeout(function() {
        s04q07_answer.play();
      }, 500);
          question_text.innerHTML =
          //==============================================
          "<strong>Excellent. You need to remove your lock and tag. Remember that you must only ever remove your own lock and tag.</strong>";
          //==============================================
          $('.balance-text').balanceText();
          m_animation.apply(charLock,"Lock_Tag_Disappear_X_B4W_BAKED");
          m_animation.set_behavior(charLock, m_animation.AB_FINISH_STOP);
          m_animation.play(charLock);
          m_notifications.setIcon(1,"check",null,null);
          break;
        case "Conveyor_Control":
        case "Conveyor_Control.001":
          setTimeout(function() {
        s04q07_notright.play();
      }, 500);
          //==============================================
          GiveHint("<strong>This isn’t right. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(3,"cross",null,null);
          break;
        case "Walkie":
          setTimeout(function() {
        s04q07_notright.play();
      }, 500);
          //==============================================
          GiveHint("<strong>This isn’t right. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(0,"cross",null,null);
          break;
        case "Motor_Gearbox_Lid":
          setTimeout(function() {
        s04q07_notright.play();
      }, 500);
          //==============================================
          GiveHint("<strong>This isn’t right. Try again.</strong>",2000,false);
          //==============================================
          $('.balance-text').balanceText();
          m_notifications.setIcon(2,"cross",null,null);
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
  var q2Correct = [];
  function ValidateQuestion() {
    // var correctName;
    // var answer = false;
    var objName = m_scenes.get_object_name(dragObj);
    switch (objName){ //Walkie[1], Toolbox[3] & Motor_Gearbox_Lid[2], Isolator_Motor[0]
    case "Conveyor_Control":
    case "Conveyor_Control.001":
      return [false, objName];
      break;
    case "Isolator_Motor":
        switch (correct){
          case 0:
          return [false, objName];
          break;
          case 1:
          return [false, objName];
          break;
          case 2:
          return [true, objName];
          break;
        }
      break;
    case "Motor_Gearbox_Lid":
        switch (correct){
          case 0:
          return [false, objName];
          break;
          case 1:
          if (q2Correct[0] == null){
            q2Correct[0] = "Motor_Gearbox_Lid";
          } else if (q2Correct[0] == "Toolbox"){
            q2Correct[1] = "Motor_Gearbox_Lid";
          }
          return [true, objName];
          break;
          case 2:
          return [false, objName];
          break;
        }
      break;
    case "Toolbox":
        switch (correct){
          case 0:
          return [false, objName];
          break;
          case 1:
          if (q2Correct[0] == null){
            q2Correct[0] = "Toolbox";
          } else if (q2Correct[0] == "Motor_Gearbox_Lid"){
            q2Correct[1] = "Toolbox";
          }
          return [true, objName];
          break;
          case 2:
          return [false, objName];
          break;
        }
      break;
     case "Walkie":
        switch (correct){
          case 0:
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
                "<strong>Notify personnel in the area and confirm their safety</strong>",3000,true);
              break;
            case "noti_icons_1":
              GiveHint(
                "<strong>Turn the isolator off at the motor</strong>",3000,true);
              break;
            case "noti_icons_2":
              GiveHint(
                "<strong>Reinstall guards</strong>",1500,true);
              break;
            case "noti_icons_3":
              GiveHint(
                "<strong>Remove all tools</strong>",1500,true);
              break;
            }
          break;
          case 1: //QUESTION 2
          switch (objPar){
            case "noti_icons_0":
              GiveHint(
                "<strong>Notify personnel in the area and confirm their safety</strong>",3000,true);
              break;
            case "noti_icons_1":
              GiveHint(
                "<strong>Turn the isolator off at the motor</strong>",3000,true);
              break;
            case "noti_icons_2":
              GiveHint(
                "<strong>Reinstall guards</strong>",1500,true);
              break;
            case "noti_icons_3":
              GiveHint(
                "<strong>Remove all tools</strong>",1500,true);
              break;
            }
          break;
          case 2: //QUESTION 3
          switch (objPar){
            case "noti_icons_0":
              GiveHint(
                "<strong>Notify personnel in the area and confirm their safety</strong>",3000,true);
              break;
            case "noti_icons_1":
              GiveHint(
                "<strong>Remove locks and tags</strong>",3000,true);
              break;
            case "noti_icons_2":
              GiveHint(
                "<strong>Reinstall guards</strong>",1500,true);
              break;
            case "noti_icons_3":
              GiveHint(
                "<strong>Restore energy</strong>",1500,true);
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
            if (correct == 1){
              question_text.innerHTML =
            //==============================================
            "<strong>Now that you’ve notified personnel in the area and confirmed their safety, what are the next two things you do?</strong>";
            //==============================================
              if (q2Correct.length == 2) {
                // m_notifications.animateIcon("all","Icon_Outro_X_B4W_BAKED");
                correct++;
                m_quiz.next_question();
              }
            } else {
              correct++;
              // m_notifications.animateIcon("all","Icon_Outro_X_B4W_BAKED");
              m_quiz.next_question();
            }
            question_box.style.borderColor = oldBorderCol;
            question_box.style.color = oldBorderCol;
              submitted = false;
          }, 1000);

          if (correct == 1){
            if (q2Correct.length == 2) {
              m_notifications.animateIcon("all","Icon_Outro_X_B4W_BAKED");
            }
          } else {
            m_notifications.animateIcon("all","Icon_Outro_X_B4W_BAKED");
          }

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
b4w.require("section_04").init();
