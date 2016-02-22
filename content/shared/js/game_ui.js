"use strict"

b4w.register("game_ui", function(exports, require) {

var m_main     = require("main");
var m_container = require("container");
var m_cfg      = require("config");
var m_scene_info = require("scene_info");
var m_cutscene = require("cutscene");
var m_quiz     = require("quiz");
var cm         = parent.cm;
var course     = parent.course;

var colour_schemes = {
  light_blue: { background: "#0099CC", border: "#007DA7" },
  blue:       { background: "#143F95", border: "#122B5F" },
  green:      { background: "#009966", border: "#117856" },
  orange:     { background: "#FF6633", border: "#D24C1F" },
  red:        { background: "#FF0000", border: "#C71B1B" }
}

var ui = {};

exports.play_cutscene = function() {
  console.log("No play_cutscene function provided.");
};


function init_main_menu() {
  var menu_button = document.getElementById("menu_button");
  var main_menu = document.getElementById("main_menu");
  var nav_menu = document.getElementById("nav_menu");
  var menu_nav = document.getElementById("nav_button");
  var menu_lightbox = document.getElementById("menu_lightbox");
  var menu_resume = document.getElementById("resume_button");
  var cutscene_button = document.getElementById("cutscene_button");
  var tutorial_button = document.getElementById("tutorial_button");
  var in_menu = false;


  function play_cutscene(e) {
    main_menu.style.display = "none";
    menu_lightbox.style.display = "none";
    exports.play_cutscene();
  }

  function play_tutorial(e) {
    main_menu.style.display = "none";
    menu_lightbox.style.display = "none";
    exports.set_game_hidden(true);
    exports.play_tutorial(function() {
      exports.set_game_hidden(false);
      m_main.resume();
    });
  }

  function open_menu(e) {
    main_menu.style.display = "block";
    menu_lightbox.style.display = "block";
    main_menu.style.animationName = "pop";
    main_menu.style.animationDuration = "0.2s";
    in_menu = true;
    m_main.pause();
  }

  function open_nav_menu(e) {
    main_menu.style.display = "none";
    nav_menu.style.display = "block";
    nav_menu.style.animationName = "pop";
    nav_menu.style.animationDuration = "0.2s";
  }

  function close_menu(e) {
    if (in_menu) {
      main_menu.style.animationName = "null";
      main_menu.style.display = "none";
      menu_lightbox.style.display = "none";
      m_main.resume();
      in_menu = false;
    }
  }

  function init_quality_dropdown() {
    var dropdown = document.getElementById("quality_dropdown");
    dropdown.addEventListener("change", function(e) {
      location.search = "?skip_intro=1&quality=" + dropdown.value;
    });

    var quality;
    switch (m_cfg.get("quality")) {
    case m_cfg.P_LOW: quality = "low"; break;
    case m_cfg.P_HIGH: quality = "high"; break;
    case m_cfg.P_ULTRA: quality = "ultra"; break;
    }

    if (quality)
      dropdown.value = quality;
  }

  init_quality_dropdown();
  menu_resume.addEventListener("click", close_menu);
  menu_nav.addEventListener("click", open_nav_menu);
  cutscene_button.addEventListener("click", play_cutscene);
  tutorial_button.addEventListener("click", play_tutorial);
  menu_button.addEventListener("click", open_menu);
}

function init_nav_menu() {
  if (cm === undefined)
    return;

  var nav_back = document.getElementById("nav_back_button");
  var nav_menu = document.getElementById("nav_menu");
  var main_menu = document.getElementById("main_menu");

  function open_main_menu(e) {
    nav_menu.style.display = "none";
    main_menu.style.display = "block";
    main_menu.style.animationName = "pop";
    main_menu.style.animationDuration = "0.2s";
  }

  nav_back.addEventListener("click", open_main_menu);

  // IE Complains about course not being defined at some point.
  course.each_section(function(short_name, long_name) {
    var button = document.createElement("div");
    button.className = "button";
    button.appendChild(document.createTextNode(long_name));
    button.addEventListener("click", function(e) {
      course.set_active_section(short_name);
    });
    nav_menu.appendChild(button);
  });
}

function init_ui() {
  init_main_menu();
  init_nav_menu();
}

exports.init = function() {
  var colour_scheme_name = m_scene_info.get_info("colour_scheme");
  var header_img_name = m_scene_info.get_info("icon");
  var question_count = m_scene_info.get_info("questions");
  if (colour_schemes[colour_scheme_name] === undefined) {
    console.error("Could not set colour scheme to '"+colour_scheme_name+"'.");
    return;
  }
  var scheme = colour_schemes[colour_scheme_name];
  var sheet = document.createElement("style");
  sheet.innerHTML = "#overlay_bar { background-color: "+scheme.background+"; box-shadow: 0px -5px 0px 0px "+scheme.border+"; } " +
                    ".menu { border-color: "+scheme.border+"; color:"+scheme.border+"; } " +
                    ".menu .button { color: "+scheme.border+"; border-color: "+scheme.border+";} " +
                    ".menu .button:hover { background-color: "+scheme.border+"; } " +
                    ".menu h2 { color: "+scheme.border+"; } " +
                    ".question_inactive { background-color: "+scheme.border+"; }" +
                    ".question_active { border-color: "+scheme.border+"; } " +
                    "#question_box { border-color: "+scheme.border+"; color: "+scheme.border+"; } " +
                    "#view_button { background-color: "+scheme.background+"; } ";
  document.head.appendChild(sheet);

  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      var game_elem = document.createElement("div");
      game_elem.id = "game";
      var title = "Title";
      var subtitle = "Subtitle";
      if (course !== undefined) {
        title = course.get_title();
        subtitle = course.get_subtitle();
      }
      game_elem.innerHTML = req.responseText.replace("##HEADER_IMG_NAME##", header_img_name).replace("##TITLE##", title).replace("##SUBTITLE##", subtitle);
      document.body.appendChild(game_elem);

      var questions = document.getElementById("questions");
      if (questions) {
        var list = document.createElement("ul");
        for (var i=0; i < question_count; i++) {
          var item = document.createElement("li");
          item.id = "mark_"+i;
          if (i == 0)
            item.className = "question_active";
          else
            item.className = "question_inactive";
          list.appendChild(item);
        }
        questions.appendChild(list);
      }
      init_ui();
    }
  }
  req.open("GET", "../shared/html/ui.html", true);
  req.send();
}

exports.update_load_screen = function(percent, load_time) {
  var status_line = document.getElementById("title_percent");
  if (status_line)
    status_line.innerHTML = percent+"%";
}

exports.close_load_screen = function(skip_title) {
  var load_screen = document.getElementById("load_screen");
  var load_block = document.getElementById("title_logo");
  var title_block = document.getElementById("title_text");

  function fade_out_load_screen() {
    load_screen.style.animationName = "fadeOut";
    load_screen.style.animationDuration = "0.5s";
    window.setTimeout(function() {
      load_screen.parentNode.removeChild(load_screen);
      m_cutscene.play();
    }, 500);
  }

  if (skip_title) {
    fade_out_load_screen();
  }
  else {
    load_block.style.animationName = "fadeOut";
    load_block.style.animationDuration = "0.2s";
    window.setTimeout(function() {
      load_block.style.display = "none";
      title_block.style.display = "block";
      title_block.style.animationName = "fadeIn";
      title_block.style.animationDuration = "0.2s";
      window.setTimeout(fade_out_load_screen, 2000);
    }, 200);
  }
}

exports.set_game_hidden = function(value) {
  var display = value ? "none" : "block";
  var canvas = m_container.get_canvas();
  var overlay = document.getElementById("quiz_wrapper");
  canvas.style.display = display;
  overlay.style.display = display;
}

exports.detect_mobile = function() {
  return (navigator.userAgent.match(/Android/i) ||
          navigator.userAgent.match(/webOS/i) ||
          navigator.userAgent.match(/iPhone/i) ||
          navigator.userAgent.match(/iPad/i) ||
          navigator.userAgent.match(/iPod/i) ||
          navigator.userAgent.match(/BlackBerry/i) ||
          navigator.userAgent.match(/Windows Phone/i));
}

exports.play_tutorial = function(callback) {
  var container = document.getElementById("cutscene_container");
  var platform = "desktop";
  if (exports.detect_mobile())
    platform = "mobile";
  m_cutscene.play_cutscene(container, ["../shared/video/tutorial_"+platform+".mp4"], callback);
}

});