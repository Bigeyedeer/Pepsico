"use strict"

// register the application module
b4w.register("prototype", function(exports, require) {

// import modules used by the app
var m_scene_info    = require("scene_info");
var m_game_ui       = require("game_ui");
var m_line_speed    = require("line_speed");
var m_preloader     = require("preloader");
var m_app           = require("app");
var m_camera        = require("camera");
var m_camera_anim   = require("camera_anim");
var m_cfg           = require("config");
var m_clock_sim     = require("clock_sim");
var m_time_slices   = require("time_slices");
var m_constrain     = require("constraints");
var m_ctl           = require("controls");
var m_cutscene      = require("cutscene");
var m_data          = require("data");
var m_events        = require("events");
var m_main          = require("main");
var m_container     = require("container");
var m_planes        = require("planes");
var m_quiz          = require("quiz");
var m_scene_anim    = require("scene_anim");
var m_scene_mouse   = require("scene_mouse");
var m_scene_cache   = require("scene_cache");
var m_scenes        = require("scenes");
var m_time          = require("time");
var m_trans         = require("transform");
var m_vec3          = require("vec3");
var m_notifications = require("notifications");
var m_objects       = require("objects");
var m_geometry      = require("geometry");
var course          = parent.course;

var ITEM_NAMES = ["Office_Chair", "Monitor", "Keyboard", "Mouse",
                  "Phone", "Table_Drawer_Top", "Table_Drawer_Bottom", "Dustbin"];

var gobj = m_scene_cache.gobj;

var mark_offset;
var submitted = false;
//***
// var noti_icons;
// var noti_check;
// var noti_alert;
// var noti_cross;

var s01q01_answer = new Audio('audio/s01q01_answer.mp3');
var s01q01_question = new Audio('audio/s01q01_question.mp3');
var s01q01_toolow = new Audio('audio/s01q01_toolow.mp3');
var s01q02_answer = new Audio('audio/s01q02_answer.mp3');
var s01q02_answerA = new Audio('audio/s01q02_answerA.mp3');
var s01q02_answerB = new Audio('audio/s01q02_answerB.mp3');
var s01q02_question = new Audio('audio/s01q02_question.mp3');
var s01q02_tooclose = new Audio('audio/s01q02_tooclose.mp3');
var s01q02_toofar = new Audio('audio/s01q02_toofar.mp3');
var s01q03_answer = new Audio('audio/s01q03_answer.mp3');
var s01q03_question = new Audio('audio/s01q03_question.mp3');
var s01q03_tooclose = new Audio('audio/s01q03_tooclose.mp3');
var s01q04_question = new Audio('audio/s01q04_question.mp3');

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

var alignment_tracker;

function AlignmentTracker() {
  var items = new Array();
  this.max_distance = 0.1;

  this.add_item = function(name, obj, target, mark) {
    var dict = new Object();
    dict.name = name;
    dict.obj = obj;
    dict.target = target;
    dict.mark = mark;
    dict.aligned = null;
    items.push(dict);
  }

  this.update = function(e) {
    if (items.length < 1)
      return;
    for (var item = items[0], i = 0; i < items.length; i++, item = items[i]) {
      var new_aligned = m_trans.distance(item.obj, item.target) <= this.max_distance;
      if (item.aligned == null || new_aligned != item.aligned) {
        var old_aligned = item.aligned;
        item.aligned = new_aligned;
      }
    }
  }

  this.get_aligned = function(name) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].name == name) {
        return items[i].aligned;
      }
    }
  }
}

/**
 * export the method to initialize the app (called at the bottom of this file)
 */
exports.init = function() {
  m_scene_info.init({
    name: "mod_1_sec_1",
    icon: "mod_1_sec_1",
    colour_scheme: "blue",
    questions: 4
  });
  m_game_ui.init();
  m_game_ui.play_cutscene = play_cutscene;
  set_quality();
  m_cfg.set("physics_enabled", false);
  m_app.init({
    canvas_container_id: "main_canvas_container",
    callback: init_cb,
    show_fps: false,
    autoresize: true,
    console_verbose: false,
    physics_enabled: false,
    track_container_position: false
  });
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

  m_app.enable_controls(canvas_elem);

  load();
}

/**
 * load the scene data
 */
function load() {
  m_data.load("mod_1_sec_1.json", load_cb, function(percent, load_time) {
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

  // place your code here
  m_scene_mouse.set_up();
  set_up_planes();
  set_up_listeners();
  set_up_clock();
  set_up_alignment_tracker();
  m_notifications.setupIcons(1); //***
  set_up_animations();

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
  m_cutscene.play_cutscene(container, ["video/section_01.mp4"], end_cutscene, buffer);
}

function end_cutscene() {
  if (m_main.is_paused())
    m_main.resume();
  m_game_ui.set_game_hidden(false);
  document.getElementById('mod_header').style.animationPlayState = 'running';
  start_quiz();
}

function set_up_buttons() {
  var button_up = gobj("Up_Button_Root");
  m_trans.set_scale(button_up, 1);
  m_trans.set_scale(button_down, 1);
}

function set_up_listeners() {
  var canvas = m_container.get_canvas();
  canvas.addEventListener("click", on_mouse_click);
}

function set_up_planes() {
  m_planes.init();
  m_planes.manage_camera_controls(true);
  var enabled = ["Dustbin"];
  for (var i = 0; i < ITEM_NAMES.length; i++) {
    var obj = gobj(ITEM_NAMES[i]);
    var plane = m_planes.plane_from_scene(gobj(ITEM_NAMES[i]+"_Plane"));
    m_planes.make_draggable(obj, plane, true, enabled.indexOf(ITEM_NAMES[i]) != -1);
  }
}

function set_up_clock() {
  var hour_hand = gobj("Hours");
  var minute_hand = gobj("Minutes");
  var time_slice = gobj("Pie_Slice");
  var date = new Date();
  m_clock_sim.manage_clock(hour_hand, minute_hand);
  m_time_slices.set_up(time_slice);
  m_clock_sim.set_time_hm(date.getHours(), date.getMinutes());
  m_clock_sim.set_time_scale(1);
  m_clock_sim.animate();
}

//***
// function set_up_noti_icons(){
//   noti_icons = gobj("noti_icons");
//   noti_check = gobj("noti_check");
//   noti_alert = gobj("noti_alert");
//   noti_cross = gobj("noti_cross");

//   m_trans.set_scale(noti_check,0);
//   m_trans.set_scale(noti_alert,0);
//   m_trans.set_scale(noti_cross,0);
// }

function set_up_animations() {
  m_scene_anim.set_up();
  m_scene_anim.idle();
}

function end_quiz() {
  question_box.style.display = "none";
  $('#fade').css({ 'background-color': 'rgba(0, 0, 0, 1)' });
  document.getElementById("fade").style.zIndex = "10";
  setTimeout(function() {
    if (course)
      course.finish_active_section();
    else
      window.location = "../mod_1_sec_2/index.html";
  },1500);
}

//***
function start_quiz() {
  var question_box = document.getElementById("question_box");
  var question_text = document.getElementById("question_text");

  var set_question_text = function(text) {
    question_text.innerHTML = text;
    $('.balance-text').balanceText();
  }
  var wristsGood = false;

  m_quiz.add_question(new function() {
    var self = this;
    var state = {chair_near: false, chair_high: false};

    function on_click(e) {
      var obj = m_scenes.pick_object(e.clientX, e.clientY);
      if (!obj)
        return;
      if (m_scenes.get_object_name(obj) == "Up_Button") {
        UIclick.play();
        if (state.chair_high){
          //DOWN
          m_scene_anim.drop_chair();
          m_geometry.set_shape_key_value(obj, "Up/Down", 0);
        } else {
          //UP
          m_scene_anim.lift_chair();
          m_geometry.set_shape_key_value(obj, "Up/Down", 1);
        }
        state.chair_high = !state.chair_high;
      }
      if (state.chair_high && state.chair_near)
        m_quiz.check_question();
    }

    function let_go_listener(data) {
      if (submitted == false){
        alignment_tracker.update();
        state.chair_near = alignment_tracker.get_aligned("Office_Chair");
        if (m_scene_anim.get_state() != "lift_chair" && state.chair_near){
          if (m_scene_anim.shrug() != false){
            wristsGood = true;
            //play sound
            s01q02_answerB.play();
            //show hint
            GiveHint("<strong>Her wrists should be level with, or slightly below, her elbows.</strong>",3000,true);
          } else {
          }
        }
        if (state.chair_high && state.chair_near)
          m_quiz.check_question();
      }
    }

    self.set_up = function() {
      question_box.style.display = "block";
      setTimeout(function() {
        s01q01_question.play();
      }, 500);
      set_question_text("<strong>Which is the best way for Keani to position her chair?</strong>");
      //set_noti("alert",0.9,"Office_Chair");
      //***
      m_notifications.setIcon(1,"alert",null,null);
      m_notifications.setIconConstraint(0,"Office_Chair",0.9);
      setTimeout(function() {
        m_notifications.animateIcon("all","Icon_Intro_X_B4W_BAKED");
      }, 1000);

      setTimeout(function() {
        m_scenes.apply_outline_anim_def(gobj("ChairMesh"));
      }, 1000);

      m_scene_mouse.set_hover_cursor(gobj("Office_Chair"), "move");
      m_scene_mouse.set_hover_cursor("Up_Button", "pointer");
      // m_scene_mouse.set_hover_cursor("Down_Button", "pointer");

      m_trans.set_scale(gobj("Up_Button_Root"), 1);

      m_planes.set_enabled(gobj("Office_Chair"), true);
      m_planes.add_listener("let_go", let_go_listener);
      m_container.get_canvas().addEventListener("click", on_click);
    }

    self.check = function() {
      if (!state.chair_near) {
        set_question_text("<strong>Keani is too far from her keyboard.</strong>");
      } else if (!state.chair_high) {
        setTimeout(function() {
        s01q01_toolow.play();
      }, 10);
        set_question_text("<strong>Keani is too low.</strong>");
      } else {
        setTimeout(function() {
        s01q01_answer.play();
      }, 10);
        set_question_text("<strong>Yes. Keani should have her thighs parallel to the ground and her feet resting on the floor.</strong>");
        wait = 5000;
        return true;
      }
      return false;
    }

    self.tear_down = function() {
      m_planes.remove_listener("let_go", let_go_listener);
      m_container.get_canvas().removeEventListener("click", on_click);
      m_scene_mouse.set_hover_cursor(gobj("Office_Chair"), null);
      m_scene_mouse.set_hover_cursor(gobj("Up_Button"), null);
      // m_scene_mouse.set_hover_cursor(gobj("Down_Button"), null);
      m_trans.set_scale(gobj("Up_Button_Root"), 0);
      // m_trans.set_scale(gobj("Down_Button_Root"), 0);
      m_planes.set_enabled(gobj("Office_Chair"), false);
      m_planes.set_enabled(gobj("Table_Drawer_Top"), true);
      m_planes.set_enabled(gobj("Table_Drawer_Bottom"), true);
      m_scene_mouse.set_hover_cursor(gobj("Table_Drawer_Top"), "move");
      m_scene_mouse.set_hover_cursor(gobj("Table_Drawer_Bottom"), "move");
      m_scene_anim.use_footstool();
      m_scenes.clear_outline_anim(gobj("ChairMesh"));
    }
  });

  m_quiz.add_question(new function() {
    var self = this;

    function drag_listener(dragging) {
      if (submitted == false){
        var pos = m_trans.get_translation(dragging.obj);
        var min = -0.8553, max = -0.7109;
        m_scene_anim.set_reach(Math.ceil(((max - pos[0])/(max - min))*11+40));
      }
    }

    function let_go_listener(data) {
      if (submitted == false){
        m_quiz.check_question();
      }
    }

    self.set_up = function() {
      m_notifications.animateIcon("all","Icon_Intro_X_B4W_BAKED");
      setTimeout(function() {
        m_scenes.apply_outline_anim_def(gobj("Monitor"));
      }, 1000);

      setTimeout(function() {
        s01q03_question.play();
      }, 500);
      set_question_text("<strong>What is the best way for Keani to position her monitor?</strong>")
      //set_noti("alert",0.47,"Monitor");
      m_notifications.setIcon(1,"alert",null,null);
      m_notifications.setIconConstraint(0,"Monitor",0.47); //***
      m_scene_anim.reach_to(40);
      m_scene_mouse.set_hover_cursor(gobj("Monitor"), "move");
      m_planes.set_enabled(gobj("Monitor"), true);
      m_planes.add_listener("dragging", drag_listener);
      m_planes.add_listener("let_go", let_go_listener);
    }

    self.check = function() {
      alignment_tracker.update();
      if (alignment_tracker.get_aligned("Monitor")) {
        setTimeout(function() {
        s01q03_answer.play();
      }, 10);
        set_question_text("<strong>That's right. Her monitor should be at about an arm's distance away from her.</strong>");
        wait = 4000;
        return true;
      } else {
        setTimeout(function() {
        s01q03_tooclose.play();
      }, 10);
        set_question_text("<strong>The monitor is too close to Keani.</strong>");
      }
      return false;
    }

    self.tear_down = function() {
      m_scene_anim.unreach();
      m_planes.set_enabled(gobj("Monitor"), false);
      m_scene_mouse.set_hover_cursor("Monitor", null);
      m_planes.remove_listener("dragging", drag_listener);
      m_planes.remove_listener("let_go", let_go_listener);
    }
  });

  m_quiz.add_question(new function() {
    var self = this;
    var state = {mouse_aligned: false, keyboard_aligned: false};

    function let_go_listener(data) {
      if (submitted == false){
        alignment_tracker.update();
        state.keyboard_aligned = alignment_tracker.get_aligned("Keyboard");
        state.mouse_aligned = alignment_tracker.get_aligned("Mouse");

        if (state.keyboard_aligned && state.mouse_aligned)
          m_quiz.check_question();
      }
    }

    self.set_up = function() {
      m_notifications.animateIcon("all","Icon_Intro_X_B4W_BAKED");
      m_scenes.clear_outline_anim(gobj("Monitor"));
      setTimeout(function() {
        m_scenes.apply_outline_anim_def(gobj("Keyboard"));
        m_scenes.apply_outline_anim_def(gobj("Mouse"));
      }, 1000);

      setTimeout(function() {
        s01q02_question.play();
      }, 500);
      set_question_text("<strong>What is the best way for Keani to position her keyboard and mouse?</strong>"); //JB Edit
      //set_noti("alert",0.05,"Keyboard");
      m_notifications.setIcon(1,"alert",null,null);
      m_notifications.setIconConstraint(0,"Keyboard",0.05); //***

      m_scene_mouse.set_hover_cursor("Keyboard", "move");
      m_scene_mouse.set_hover_cursor("Mouse", "move");

      m_planes.set_enabled(gobj("Keyboard"), true);
      m_planes.set_enabled(gobj("Mouse"), true);

      m_planes.add_listener("let_go", let_go_listener);
    }

    self.check = function() {
      if (!state.keyboard_aligned) {
        set_question_text("<strong>This isn’t right. Her keyboard is too far away. Try again.</strong>");
        setTimeout(function() {
          s01q02_toofar.play();
        }, 10);
      } else if (!state.mouse_aligned) {
        set_question_text("<strong>This isn’t right. Her mouse is too far away. Try again.</strong>");
        setTimeout(function() {
          s01q02_toofar.play();
        }, 10);
        set_noti("alert",0.05,"Mouse");
      }
      else {
        if (wristsGood) {
          setTimeout(function() {
            s01q02_answerA.play();  
          }, 10);
          set_question_text("<strong>Yes. Her keyboard and mouse should be within arms reach.</strong>");
          wait = 3000;
        } else {
          setTimeout(function() {
            s01q02_answer.play();
          }, 10);
          set_question_text("<strong>Yes. Her keyboard and mouse should be within arms reach. Her wrists should be level with, or slightly below, her elbows.</strong>");
          wait = 7000;
        }
        return true;
      }
      return false;
    }

    self.tear_down = function() {
      m_planes.remove_listener("let_go", let_go_listener);
      m_scene_anim.start_typing();
      m_scene_mouse.set_hover_cursor("Keyboard", null);
      m_scene_mouse.set_hover_cursor("Mouse", null);
      m_planes.set_enabled(gobj("Keyboard"), false);
      m_planes.set_enabled(gobj("Mouse"), false);
    }
  });

  m_quiz.add_question({
    start_time: 0,
    winding_back: false,
    let_go_listener: function(dragging) {
      if (submitted == false){
        UIclick.play();
        m_quiz.check_question();
      }
    },
    bound: new Object(),
    forward_time_listener: function() {
      var time_passed = m_clock_sim.get_time_passed(this.start_time);
      m_time_slices.set_ramp_value(time_passed / 30.0);
      if (time_passed > 30)
        m_quiz.check_question();
    },
    wind_back_listener: function() {
      this.winding_back = false;
      m_time_slices.start_slices();
    },
    on_click: function(e) {
      UIclick.play();
      var obj = m_scenes.pick_object(e.clientX, e.clientY);
      if (!obj)
        return;
      if (m_scenes.get_object_name(obj) == "Clock") {
        m_quiz.check_question();
      }
    },
    set_up: function() {
      m_notifications.animateIcon("all","Icon_Intro_X_B4W_BAKED");
      m_scenes.clear_outline_anim(gobj("Keyboard"));
      m_scenes.clear_outline_anim(gobj("Mouse"));
      setTimeout(function() {
        m_scenes.apply_outline_anim_def(gobj("Clock"));
      }, 1000);

      set_question_text("<strong>How often should Keani get up from her desk, and stretch?</strong>");
      setTimeout(function() {
        s01q04_question.play();
      }, 500);
      //set_noti("alert",0.2,"Clock");
      m_notifications.setIcon(1,"alert",null,null);
      m_notifications.setIconConstraint(0,"Clock",0.2); //***
      m_clock_sim.lerp_time_scale(1.0, 200.0, 3000);
      m_time_slices.start_slices();
      m_scene_mouse.set_hover_cursor(gobj("Clock"), "pointer");
      this.start_time = m_clock_sim.get_time();
      this.bound.forward_time_listener = this.forward_time_listener.bind(this);
      this.bound.wind_back_listener = this.wind_back_listener.bind(this);
      this.bound.on_click = this.on_click.bind(this);
      m_clock_sim.add_listener("update_clock", this.bound.forward_time_listener);
      m_clock_sim.add_listener("wind_back", this.bound.wind_back_listener);
      m_container.get_canvas().addEventListener("click", this.bound.on_click);
    },
    check: function() {
      var time_passed = m_clock_sim.get_time_passed(m_time_slices.get_slice_time());
      if (time_passed < 25 || time_passed > 30 || this.winding_back) {
        if (time_passed > 30) {
          m_time_slices.clear_slices();
          m_clock_sim.wind_back(this.start_time+0.5, 500);
          this.winding_back = true;
        }
        return false;
      }
      wait = 6500;
      set_question_text("<strong>Yes. Keani should get up at least every 30 minutes and she may consider standing up to stretch when talking on the phone.</strong>");
      return true;
    },
    tear_down: function() {
      var chair = gobj("Office_Chair");
      var chair_pos = m_trans.get_translation(chair);
      var target_pos = m_trans.get_translation(gobj("Keani_Stand_Target"));
      var pos = m_vec3.create();

      m_scene_mouse.set_hover_cursor(gobj("Clock"), null);

      var trans = function(t) {
        m_vec3.lerp(chair_pos, target_pos, t*t, pos);
        m_trans.set_translation_v(chair, pos);
      }
      m_time.animate(0.0, 1.0, 1000.0, trans);
      m_time.set_timeout(m_scene_anim.stretch, 1000.0)
      m_time_slices.stop_slices();
      m_clock_sim.lerp_time_scale(500.0, 1.0, 100.0);
      m_clock_sim.remove_listener("update_clock", this.bound.forward_time_listener);
      m_clock_sim.remove_listener("wind_back", this.bound.wind_back_listener);
      m_container.get_canvas().removeEventListener("click", this.bound.on_click);
    }
  });

  m_quiz.add_listener("end", end_quiz);
  m_quiz.add_listener("question_check", on_check_question);
  m_quiz.add_listener("question_start", on_start_question);
  m_quiz.start();
}

function set_up_alignment_tracker() {
  alignment_tracker = new AlignmentTracker();
  for (var i = 0; i < ITEM_NAMES.length; i++) {
    var mark = document.getElementById("mark_"+i);
    if (mark) {
      var obj = gobj(ITEM_NAMES[i]);
      var target = gobj(ITEM_NAMES[i]+"_Target");
      alignment_tracker.add_item(ITEM_NAMES[i], obj, target, mark);
    }
  }
  alignment_tracker.update();
}
var wait = 6000;
function on_check_question(data) {
  if (submitted != true) {
    submitted = true;
    var mark = document.getElementById("mark_"+m_quiz.index());
    if (data.correct) {
      UIcorrect.play();
      m_notifications.setIcon(0,"check",null,null); //***
      mark.className = "question_active mark_right";
      /*question_box.style.animationDuration  = '0.5s';
      question_box.style.animationName  = 'pop_out_r';
      setTimeout(function() {*/
        question_box.style.animationDuration  = '0.5s';
        question_box.style.animationName  = 'pop_r';
        var oldBorderCol = question_box.style.borderColor;
        question_box.style.borderColor = '#009966';
        question_box.style.color = '#009966';
        setTimeout(function() {
          question_box.style.animationDuration  = '1s';
          question_box.style.animationName  = 'pop_out';
          setTimeout(function() {
            m_scene_anim.when_queue_empty(m_quiz.next_question);
            submitted = false;
            question_box.style.borderColor = oldBorderCol;
            question_box.style.color = oldBorderCol;
          }, 1000);
          m_notifications.animateIcon("all","Icon_Outro_X_B4W_BAKED");
        }, wait);
      /*},500);*/
    }
    else {
      UIwrong.play();
      m_notifications.setIcon(0,"cross",null,null); //***
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
  // var bodyRect = document.body.getBoundingClientRect(),
  // elemRect = document.getElementById("mark_"+index).getBoundingClientRect();
  // mark_offset = -(elemRect.right - bodyRect.right)+15; //15px offset to align middle of mark
  // question_box.style.right = mark_offset+"px";
  question_box.style.animationName  = 'pop';
  document.getElementById("mark_"+index).className = "question_active";
}

//******************************
//HINT
//******************************

  function GetHint(){
    var num = m_quiz.index();
    switch (num){
    case 0:
      GiveHint("<strong>Position the chair at the right height and distance in relation to the table.</strong>",3000,true);
      break;
    case 1:
      GiveHint("<strong>Position Keani's monitor the correct distance from her.</strong>",2200,true);
      break;
    case 2:
      GiveHint("<strong>Position the keyboard and mouse in relation to eachother and Keani.</strong>",2200,true);
      break;
    case 3:
      GiveHint("<strong>You need to stand up regularly.</strong>",500,true);
      break;
    }
  }

function GiveHint(newText, timeOut, hint){
  UIhint.play();
  var oldText = question_text.innerHTML;
  var oldCursor = question_box.style.cursor;
  console.log(oldText);
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
          question_box.style.cursor = oldCursor;
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

//***
var objPar;
var objName;

function on_mouse_click(e) {
  alignment_tracker.update();
  //***
  var picked = m_scenes.pick_object(e.clientX, e.clientY);
  if (picked == null)
    return;
  objName = m_scenes.get_object_name(picked);
  if (objName.substring(0,4) == "icon"){
    submitted = true;
    objPar = m_scenes.get_object_name(m_objects.get_parent(m_objects.get_parent(picked)));
    var iconNum = objPar.substring(11,12);
    m_notifications.animateIcon(iconNum,"Icon_Click_X_B4W_BAKED");
    GetHint();
  }
}

});

// import the app module and start the app by calling the init method
b4w.require("prototype").init();
