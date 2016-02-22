"use strict"

// register the application module
b4w.register("section_02", function(exports, require) {

// import modules used by the app
var course        = parent.course;
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
var m_scene_mouse = require("scene_mouse");

var start_camera_pivot;
var start_camera_trans;
var manage_camera_controls = false;

var mark_offset;
var submitted = false;

var canClick = true;
var charTag1;
var charTag2;
var charTag3;
var charTag4;
var ParTag1;
var ParTag2;
var ParTag3;
var ParTag4;
var tagTarget;

var question_box;
var question_text;

//UI Sounds
var UIclick = new Audio('../shared/audio/Click_Tap.mp3');
var UIcorrect = new Audio('../shared/audio/Correct.mp3');
var UIwrong = new Audio('../shared/audio/Wrong.mp3');


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
    name: "mod_2_sec_2",
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
  m_data.load("mod_2_sec_2.json", load_cb, function(percent, load_time) {
    m_line_speed.recalc_speed(percent, load_time);
    m_game_ui.update_load_screen(percent, load_time);
  });
}

/**
 * callback executed when the scene is loaded
 */
function load_cb(data_id) {
  m_game_ui.close_load_screen();
  m_app.enable_controls();
  m_app.enable_camera_controls();

  //m_cfg.set("enable_outlining",true);

  // place your code here
  m_scene_mouse.set_up();

  charTag1 = m_scenes.get_object_by_name("Tag_1_Rig");
  charTag2 = m_scenes.get_object_by_name("Tag_2_Rig");
  charTag3 = m_scenes.get_object_by_name("Tag_3_Rig");
  charTag4 = m_scenes.get_object_by_name("Tag_4_Rig");
  ParTag1 = m_scenes.get_object_by_name("TagPar1");
  ParTag2 = m_scenes.get_object_by_name("TagPar2");
  ParTag3 = m_scenes.get_object_by_name("TagPar3");
  ParTag4 = m_scenes.get_object_by_name("TagPar4");
  tagTarget = m_trans.get_translation(m_scenes.get_object_by_name("Tag_Target"));

  //Cursors
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Tag1"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Tag2"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Tag3"), "pointer");
  m_scene_mouse.set_hover_cursor(m_scenes.get_object_by_name("Tag4"), "pointer");

  question_box = document.getElementById("question_box");
  question_text = document.getElementById("question_text");

  var canvas = m_container.get_canvas();
  canvas.addEventListener("mouseup", on_mouse_up);
  canvas.addEventListener("mousedown", on_mouse_down);

  m_line_speed.freeze();
  if (qs["skip_intro"] == "1")
    end_cutscene();
  else {
    m_main.pause();
    m_game_ui.set_game_hidden(true);
    m_game_ui.play_tutorial(function() { play_cutscene(false) });
  }
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
      window.location.href = "../mod_2_sec_3/index.html";
  },1500);
}

var dragObj = null;
var objName;

function on_mouse_down(e) {
  dragObj = m_scenes.pick_object(e.clientX, e.clientY);
}

function on_mouse_up(e) {
  if (m_scenes.pick_object(e.clientX, e.clientY) == dragObj){
    if (dragObj != last[3]){
      UIclick.play();
      if (submitted == false){
        objName = m_scenes.get_object_name(dragObj);
        if (dragObj != null){
          m_quiz.check_question();
          submitted = true;
        }
      }
    } else {
      if (m_animation.is_play(last[0]) == true){
        UIclick.play();
        m_animation.stop(last[0]);
      } else {
        UIclick.play();
        m_animation.play(last[0]);
      }
    }
  }
}

//******************************
//QUESTIONS
//******************************

var s01q01_answer = new Audio('audio/s01q01_answer.mp3');
var s01q01_commissioning = new Audio('audio/s01q01_commissioning.mp3');
var s01q01_commissioning2 = new Audio('audio/s01q01_commissioning2.mp3');
var s01q01_information = new Audio('audio/s01q01_information.mp3');
var s01q01_information2 = new Audio('audio/s01q01_information2.mp3');
var s01q01_outofservice = new Audio('audio/s01q01_outofservice.mp3');
var s01q01_outofservice2 = new Audio('audio/s01q01_outofservice2.mp3');
var s01q01_personal = new Audio('audio/s01q01_personal.mp3');
var s01q01_personal2 = new Audio('audio/s01q01_personal2.mp3');
var s01q01_question = new Audio('audio/s01q01_question.mp3');

var wait = 3000;

function start_quiz() {

m_quiz.add_question({
    set_up: function() {
      setTimeout(function() {
        s01q01_question.play();
      }, 500);
      question_box.style.display = 'block'
      document.getElementById('question_tap_tooltip').style.display = 'none';
      question_box.style.paddingBottom = '0px';
      question_box.style.cursor = 'default';
      question_box.style.animationName  = 'pop';
      question_text.innerHTML =
        //==============================================
        "<strong>Here are the tags we use at PepsiCo. Click on each of the tags to find out more.</strong>";
        //==============================================
      //$('.balance-text').balanceText();


    },
    check: function() {
      var validationData = ValidateQuestion();
      processAnswer(validationData);
        return validationData[0];
    }
  });

m_quiz.add_question({
    set_up: function() {
      // setTimeout(function() {
      //   s01q01_question.play();
      // }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>Here are the tags we use at PepsiCo. Click on each of the tags to find out more.</strong>";
        //==============================================
      //$('.balance-text').balanceText();


    },
    check: function() {
      var validationData = ValidateQuestion();
      processAnswer(validationData);
        return validationData[0];
    }
  });

m_quiz.add_question({
    set_up: function() {
      // setTimeout(function() {
      //   s01q01_question.play();
      // }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>Here are the tags we use at PepsiCo. Click on each of the tags to find out more.</strong>";
        //==============================================
      //$('.balance-text').balanceText();


    },
    check: function() {
      var validationData = ValidateQuestion();
      processAnswer(validationData);
        return validationData[0];
    }
  });

m_quiz.add_question({
    set_up: function() {
      // setTimeout(function() {
      //   s01q01_question.play();
      // }, 500);
      question_text.innerHTML =
        //==============================================
        "<strong>Here are the tags we use at PepsiCo. Click on each of the tags to find out more.</strong>";
        //==============================================
      //$('.balance-text').balanceText();


    },
    check: function() {
      var validationData = ValidateQuestion();
      processAnswer(validationData);
        return validationData[0];
    }
  });

  m_quiz.add_listener("end", end_quiz);
  m_quiz.add_listener("question_check", on_check_question);
  m_quiz.add_listener("question_start", on_start_question);
  m_quiz.start();
}

function processAnswer(validationData){
  switch (validationData[1]){ //check obj name
  case "Tag1":
    wait = 14500;
    setTimeout(function() {
      s01q01_personal.play();
      setTimeout(function() {
        question_box.style.animationName = "bounce";
        question_text.innerHTML =
    //==============================================
    "<strong>The person who fits the Personal Danger Tag is the only person who can remove it.</strong>";
    //==============================================
    $('.balance-text').balanceText();
        s01q01_personal2.play();
      }, 10500);
    }, 500);

    question_text.innerHTML =
    //==============================================
    "<strong>This is a personal danger tag. You must use to show that you are the person conducting the isolation. You always use a personal safety lock with a personal danger tag.</strong>";
    //==============================================
    $('.balance-text').balanceText();
    break;
  case "Tag2":
    wait = 13500;
    setTimeout(function() {
      s01q01_outofservice.play();
      setTimeout(function() {
        question_box.style.animationName = "bounce";
        question_text.innerHTML =
    //==============================================
    "<strong>These can be removed by a qualified person who must then replace it with their own Personal Danger tag and Safety Lock.</strong>";
    //==============================================
    $('.balance-text').balanceText();
        s01q01_outofservice2.play();
      }, 7500);
    }, 500);

    question_text.innerHTML =
    //==============================================
    "<strong>An Out of Service Tag must be used if equipment is unserviceable. Any equipment with this tag cannot be operated.</strong>";
    //==============================================
    $('.balance-text').balanceText();
    break;
  case "Tag3":
    wait = 6500;
    setTimeout(function() {
      s01q01_information.play();
      setTimeout(function() {
        question_box.style.animationName = "bounce";
        question_text.innerHTML =
    //==============================================
    "<strong>Any suitably qualified person can remove this tag.</strong>";
    //==============================================
    $('.balance-text').balanceText();
        s01q01_information2.play();
      }, 3500);
    }, 500);

    question_text.innerHTML =
    //==============================================
    "<strong>Information Tags are used to give information about equipment.</strong>";
    //==============================================
    $('.balance-text').balanceText();
    break;
  case "Tag4":
    wait = 12000;
    setTimeout(function() {
      s01q01_commissioning.play();
      setTimeout(function() {
        question_box.style.animationName = "bounce";
        question_text.innerHTML =
    //==============================================
    "<strong>These can be removed by a qualified person who must then replace it with their own Personal Danger tag and Safety Lock when performing work.</strong>";
    //==============================================
    $('.balance-text').balanceText();
        s01q01_commissioning2.play();
      }, 4500);
    }, 500);

    question_text.innerHTML =
    //==============================================
    "<strong>Commissioning Tags are used to provide information about plant being commissioned.</strong>";
    //==============================================
    $('.balance-text').balanceText();
    break;
  }
}

//******************************
//VALIDATE QUESTIONS
//******************************
  var correct = 0;
  var t1 = false;
  var t2 = false;
  var t3 = false;
  var t4 = false;
  var last = [];
  var firstRun = true;

  function ValidateQuestion() {
    var objName = m_scenes.get_object_name(dragObj);
    switch (objName){
    case "Tag1":
      if (firstRun == false){
        m_animation.stop(last[0]);
        m_animation.set_frame(last[0],1);
        m_trans.set_translation_v(last[2],last[1]);
      } else {
        firstRun = false;
      }
      last[1]=m_trans.get_translation(ParTag1);
      last[0]=charTag1;
      last[2]=ParTag1;
      last[3]=dragObj;
      //console.log(last[0] + " " + last[1] + " " + last[2]);
      //console.log(tagTarget);
      m_trans.set_translation_v(ParTag1,tagTarget);
      m_animation.apply(charTag1,"Tag_Roti_XX_B4W_BAKED");
      m_animation.set_behavior(charTag1, m_animation.AB_CYCLIC);
      m_animation.play(charTag1);
      if (t1 == false){
        t1 = true;
        correct++;
        return [true, objName];
      } else {
        return [false, objName];
      }
    break;
    case "Tag2":
      if (firstRun == false){
        m_animation.stop(last[0]);
        m_animation.set_frame(last[0],1);
        m_trans.set_translation_v(last[2],last[1]);
      } else {
        firstRun = false;
      }
      last[1]=m_trans.get_translation(ParTag2);
      last[0]=charTag2;
      last[2]=ParTag2;
      last[3]=dragObj;
      //console.log(last[0] + " " + last[1] + " " + last[2]);
      //console.log(tagTarget);
      m_trans.set_translation_v(ParTag2,tagTarget);
      m_animation.apply(charTag2,"Tag_Roti_XX_B4W_BAKED");
      m_animation.set_behavior(charTag2, m_animation.AB_CYCLIC);
      m_animation.play(charTag2);
      if (t2 == false){
        t2 = true;
        correct++;
        return [true, objName];
      } else {
        return [false, objName];
      }
    break;
    case "Tag3":
      if (firstRun == false){
        m_animation.stop(last[0]);
        m_animation.set_frame(last[0],1);
        m_trans.set_translation_v(last[2],last[1]);
      } else {
        firstRun = false;
      }
      last[1]=m_trans.get_translation(ParTag3);
      last[0]=charTag3;
      last[2]=ParTag3;
      last[3]=dragObj;
      //console.log(last[0] + " " + last[1] + " " + last[2]);
      //console.log(tagTarget);
      m_trans.set_translation_v(ParTag3,tagTarget);
      m_animation.apply(charTag3,"Tag_Roti_XX_B4W_BAKED");
      m_animation.set_behavior(charTag3, m_animation.AB_CYCLIC);
      m_animation.play(charTag3);
      if (t3 == false){
        t3 = true;
        correct++;
        return [true, objName];
      } else {
        return [false, objName];
      }
    break;
    case "Tag4":
      if (firstRun == false){
        m_animation.stop(last[0]);
        m_animation.set_frame(last[0],1);
        m_trans.set_translation_v(last[2],last[1]);
      } else {
        firstRun = false;
      }
      last[1]=m_trans.get_translation(ParTag4);
      last[0]=charTag4;
      last[2]=ParTag4;
      last[3]=dragObj;
      //console.log(last[0] + " " + last[1] + " " + last[2]);
      //console.log(tagTarget);
      m_trans.set_translation_v(ParTag4,tagTarget);
      m_animation.apply(charTag4,"Tag_Roti_XX_B4W_BAKED");
      m_animation.set_behavior(charTag4, m_animation.AB_CYCLIC);
      m_animation.play(charTag4);
      if (t4 == false){
        t4 = true;
        correct++;
        return [true, objName];
      } else {
        return [false, objName];
      }
    break;
    }
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
      setTimeout(function() {
        wait = 3000;
        question_box.style.animationDuration  = '1s';
        question_box.style.animationName  = 'pop_out';

        setTimeout(function() {
          tooltip.style.display = 'none';
          question_box.style.cursor = 'default';
          question_box.style.animationName  = 'pop';
          if (correct == 4){
            s01q01_answer.play();
            question_text.innerHTML =
            //==============================================
            "<strong>Never remove another person’s lock and tag unless the Permit to Work (PTW) process has been completed and the person is not contactable. Never attempt to operate plant if there is a personal danger lock and tag In place. </strong>";
            //==============================================
            setTimeout(function(){
              question_box.style.animationName  = 'fadeOut';
              m_quiz.next_question();
            },13000);
          } else {
            m_quiz.next_question();
            submitted = false;
          }
        }, 1000);
      }, wait);
    }
    else {
      //mark.className = "question_active mark_wrong";
      question_box.style.animationDuration  = '0.3s';
      question_box.style.animationName  = 'bounce';
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
b4w.require("section_02").init();
