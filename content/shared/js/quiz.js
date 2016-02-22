if (b4w.module_check("quiz"))
  throw "Could not create module 'quiz'";

b4w.register("quiz", function(exports, require) {

var m_events = require("events");

var questions = new Array();
var index = 0;
var quiz_state = "set_up";
var listenables = {
  question_start: new m_events.Listenable(),
  question_check: new m_events.Listenable(),
  end: new m_events.Listenable()
};

var event_sys = new m_events.EventSystem(["question_start", "question_check", "end"]);

exports.add_listener = event_sys.add_listener;
exports.remove_listener = event_sys.remove_listener;

exports.add_question = function(question) {
  questions.push(question);
}

exports.start = function() {
  if (quiz_state != "set_up")
    return;
  quiz_state = "active";
  questions[index].set_up();
  event_sys.dispatch_event("question_start", index);
}

exports.check_question = function() {
  if (questions.length < 1 || index >= questions.length)
    return;
  var correct = questions[index].check();
  if (correct && typeof questions[index].tear_down !== "undefined")
    questions[index].tear_down();
  event_sys.dispatch_event("question_check", {index: index, correct: correct});
}

exports.next_question = function() {
  index++;
  if (index < questions.length) {
    questions[index].set_up();
    event_sys.dispatch_event("question_start", index);
  }
  else {
    event_sys.dispatch_event("end", index);
  }
}

exports.index = function() {
  return index;
}

});