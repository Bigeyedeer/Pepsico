"use strict"

b4w.register("scorm", function(exports, require) {

var init_status = "";
var active = false;
var scorm_exists = false;


exports.init = function() {
  window.addEventListener("unload", function(e) {
    exports.terminate();
  });
  window.addEventListener("load", function(e) {
    if (active)
      doTerminate();
    init_status = doInitialize();
    scorm_exists = init_status != "false";
    active = init_status == "true";
    if (!active)
      return;
    doSetValue("adl.nav.request", "continue");
    if (doGetValue("cmi.completion_status") != "completed")
      doSetValue("cmi.completion_status", "incomplete");
  });
}

exports.is_active = function() {
  return active;
}

exports.scorm_exists = function() {
  return scorm_exists;
}

exports.sco_completed = function() {
  if (!active)
    return;
  doSetValue("cmi.success_status", "passed");
  doSetValue("cmi.completion_status", "completed");
  doTerminate();
  active = false;
}

exports.terminate = function() {
  if (!active)
    return;
  doTerminate();
  active = false;
}

});