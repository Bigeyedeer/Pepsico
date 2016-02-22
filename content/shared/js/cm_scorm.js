var cm = cm || {};

(function(scorm) {

var lms_init_status = "false";
var event_sys = new cm.events.EventSystem(["init", "disconnect"]);

scorm.add_listener = event_sys.add_listener;
scorm.remove_listener = event_sys.remove_listener;

scorm.init_listener = function(e) {
  lms_init_status = doLMSInitialize();
  if (lms_init_status == "true") {
    if (doLMSGetValue("cmi.core.lesson_status") == "not attempted")
      doLMSSetValue("cmi.core.lesson_status", "incomplete");
  }
  event_sys.dispatch_event("init", lms_init_status);
}

scorm.disconnect = function(e) {
  if (lms_init_status != "true")
    return;
  event_sys.dispatch_event("disconnect");
  doLMSFinish();
  lms_init_status = "false";
}

scorm.lms_init_status = function() {
  return lms_init_status;
}

scorm.get_value = function(variable, def_value) {
  if (lms_init_status != "true")
    return def_value;
  return doLMSGetValue(variable);
}

scorm.set_value = function(variable, value) {
  if (lms_init_status != "true") {
    console.log("Did not set SCORM variable: "+variable);
    return;
  }
  return doLMSSetValue(variable, value);
}

window.addEventListener("load", scorm.init_listener);
window.addEventListener("unload", scorm.disconnect_listener);
window.addEventListener("unbeforeload", scorm.disconnect_listener);

})(cm.scorm = cm.scorm || {});