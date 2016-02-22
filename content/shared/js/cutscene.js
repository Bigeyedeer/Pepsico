if (b4w.module_check("cutscene"))
  throw "Could not create module 'cutscenes'";

b4w.register("cutscene", function(exports, require) {

var m_main       = require("main");
var m_container  = require("container");
var m_line_speed = require("line_speed");


var SKIP_BUTTON_SRC = "../shared/images/skip.svg";
var CUSTOM_PAUSE_PLAY = (navigator.userAgent.indexOf("Chrome") != -1);

var cutscene_active = false;
var container;
var video;
var end_cutscene_cb;
var skip_button;

document.addEventListener("keyup", video_keypress);

function add_sources(video, sources) {
  for (var i = 0; i < sources.length; i++) {
    var split_point = sources[i].lastIndexOf(".");
    if (split_point == -1) {
      console.log("Invalid source: "+sources[i]);
      continue;
    }
    var file_type = sources[i].substring(split_point+1).toLowerCase();
    var other_part = sources[i].substring(0, split_point);
    var full_name = other_part+"_"+m_line_speed.classify().toLowerCase()+"."+file_type;
    var type;
    switch (file_type) {
    case "mp4":
      console.log("Adding an MP4: "+full_name);
      type = "video/mp4";
      break;
    case "webm":
      console.log("Adding a WebM: "+full_name);
      type = "video/webm";
      break;
    default:
      console.log("Invalid source: "+full_name);
    }
    if (type) {
      var source = document.createElement("source");
      source.src = full_name;
      source.type = type;
      video.appendChild(source);
    }
  }
}

exports.play_cutscene = function(container_, srcs, end_cutscene_cb_, buffer) {
  container = container_;
  end_cutscene_cb = end_cutscene_cb_;
  video = document.createElement("video");
  add_sources(video, srcs);
  video.controls = true;
  video.addEventListener("ended", on_ended);
  video.addEventListener("ended", end_cutscene_cb);
  video.addEventListener("click", video_click);
  container.appendChild(video);

  skip_button = document.createElement("div");
  var skip_img = document.createElement("img");
  skip_img.src = SKIP_BUTTON_SRC;
  skip_button.appendChild(skip_img);
  skip_button.className = "skip";
  skip_button.addEventListener("click", on_skip);
  container.appendChild(skip_button);
  container.style.display = "block";
  cutscene_active = true;
  if (buffer !== true)
    video.play();
}

exports.play = function() {
  if (cutscene_active)
    video.play();
}

function toggle_pause() {
  if (video.paused)
    video.play();
  else
    video.pause();
}

function video_click(e) {
  if (!CUSTOM_PAUSE_PLAY)
    return;
  toggle_pause();
}

function video_keypress(e) {
  if (!CUSTOM_PAUSE_PLAY)
    return;
  if (!cutscene_active)
    return;
  if (e.keyCode == 32)
    toggle_pause();
  // else
  //   console.log(e.keyCode);
}

function on_ended(e) {
  container.removeChild(video);
  container.removeChild(skip_button);
  container.style.display = "none";
  cutscene_active = false;
}

function on_skip() {
  var end_event = document.createEvent('Event');
  end_event.initEvent('ended', true, true);
  video.dispatchEvent(end_event);
}

});