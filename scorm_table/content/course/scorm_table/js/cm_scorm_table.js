var cm = cm || parent.cm || {};

(function(scorm_table) {

var scorm_vars = [
  ["cmi.comments", "rw"],
  ["cmi.comments_from_lms", "r"],
  ["cmi.core._children", "r"],
  ["cmi.core.credit", "r"],
  ["cmi.core.entry", "r"],
  ["cmi.core.exit", "w"],
  ["cmi.core.lesson_location", "rw"],
  ["cmi.core.lesson_mode", "r"],
  ["cmi.core.lesson_status", "rw"],
  ["cmi.core.score._children", "r"],
  ["cmi.core.score.max", "rw"],
  ["cmi.core.score.min", "rw"],
  ["cmi.core.score.raw", "rw"],
  ["cmi.core.session_time", "w"],
  ["cmi.core.student_id", "r"],
  ["cmi.core.student_name", "r"],
  ["cmi.interactions._children", "r"],
  ["cmi.interactions._count", "r"],
  ["cmi.interactions.0.correct_responses.0.pattern", "w"],
  ["cmi.interactions.0.correct_responses._count", "r"],
  ["cmi.interactions.0.id", "w"],
  ["cmi.interactions.0.latency", "w"],
  ["cmi.interactions.0.objectives.0.id", "w"],
  ["cmi.interactions.0.objectives._count", "r"],
  ["cmi.interactions.0.result", "w"],
  ["cmi.interactions.0.student_response", "w"],
  ["cmi.interactions.0.time", "w"],
  ["cmi.interactions.0.type", "w"],
  ["cmi.interactions.0.weighting", "w"],
  ["cmi.launch_data", "r"],
  ["cmi.objectives._children", "r"],
  ["cmi.objectives._count", "r"],
  ["cmi.objectives.0.id", "rw"],
  ["cmi.objectives.0.score._children", "r"],
  ["cmi.objectives.0.score.max", "rw"],
  ["cmi.objectives.0.score.min", "rw"],
  ["cmi.objectives.0.score.raw", "rw"],
  ["cmi.objectives.0.status", "rw"],
  ["cmi.student_data._children", "r"],
  ["cmi.student_data.mastery_score", "r"],
  ["cmi.student_data.max_time_allowed", "r"],
  ["cmi.student_data.time_limit_action", "r"],
  ["cmi.student_preference._children", "r"],
  ["cmi.student_preference.audio", "rw"],
  ["cmi.student_preference.language", "rw"],
  ["cmi.student_preference.speed", "rw"],
  ["cmi.student_preference.text", "rw"],
  ["cmi.suspend_data", "rw"]
];

function input_listener(var_name) {
  return function(e) {
    if (e instanceof KeyboardEvent) {
      if (e.which == 13)
        cm.scorm.set_value(var_name, this.value);
    }
    else if (e instanceof FocusEvent) {
      if (e.type == "focus")
        this.select();
    }
  }
}

function init_listener(init_status) {
  var table = document.getElementById("variables");
  for (var i=0; i < scorm_vars.length; i++) {
    var row = document.createElement("tr");
    var cell = document.createElement("td");
    var text_node = document.createTextNode(scorm_vars[i][0]);
    cell.appendChild(text_node);
    row.appendChild(cell);

    cell = document.createElement("td");
    text_node = document.createTextNode(scorm_vars[i][1]);
    cell.appendChild(text_node);
    row.appendChild(cell);

    cell = document.createElement("td");
    var text = "Not initialized";
    if (scorm_vars[i][1].indexOf("r") == -1)
      text = "n/a";
    else
      text = cm.scorm.get_value(scorm_vars[i][0], text);

    if (scorm_vars[i][1].indexOf("w") != -1) {
      text_node = document.createElement("input");
      text_node.type = "text";
      text_node.value = text;
      var listener = input_listener(scorm_vars[i][0]);
      text_node.addEventListener("keyup", listener);
      text_node.addEventListener("focus", listener);
    }
    else
      text_node = document.createTextNode(text);
    cell.appendChild(text_node);
    row.appendChild(cell);

    table.appendChild(row);
  }
}

scorm_table.complete = function(mode) {
  if (cm.scorm.lms_init_status() != "true")
    return;
  parent.doLMSSetValue("cmi.core.lesson_status", mode);
  parent.doLMSFinish();
}

cm.scorm.add_listener("init", init_listener);

}(cm.scorm_table = cm.scorm_table || {}));