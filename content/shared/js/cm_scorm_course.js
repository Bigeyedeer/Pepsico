var cm = cm || {};

(function(scorm) {

scorm.Course = function(iframe, base_path, title, subtitle, sections) {
  var self = this;
  var completed_sections = [];
  var section_index = 0;
  var active_section;

  self.finish_active_section = function() {
    if (completed_sections.indexOf(section_index) == -1)
      completed_sections.push(section_index);
    console.log(self.get_progress());
    var next_index = -1;
    for (var i=section_index+1; i < sections.length; i++) {
      if (completed_sections.indexOf(i) == -1) {
        next_index = i;
        break;
      }
    }
    if (next_index == -1) {
      for (var i=0; i < sections.length; i++) {
        if (completed_sections.indexOf(i) == -1) {
          next_index = i;
          break;
        }
      }
    }
    scorm.set_value("cmi.core.lesson_location", section_index+":"+completed_sections.join(","));
    if (next_index > -1) {
      section_index = next_index;
      active_section = sections[section_index][0];
      iframe.src = base_path+"/"+active_section+"/index.html";
    }
    else {
      scorm.set_value("cmi.core.lesson_status", "passed");
      scorm.disconnect();
    }
  }

  self.get_title = function() {
    return title;
  }

  self.get_subtitle = function() {
    return subtitle;
  }

  self.get_progress = function() {
    return completed_sections.length / sections.length;
  }

  self.load = function() {
    var loc = scorm.get_value("cmi.core.lesson_location", "0:").split(":");
    section_index = Number(loc[0]);
    active_section = sections[section_index][0];
    if (loc.length > 1)
      completed_sections = loc[1].split(",").map(Number);

    iframe.src = base_path+"/"+active_section+"/index.html";
  }

  self.set_active_section = function(short_name) {
    for (var i = 0; i < sections.length; i++) {
      if (sections[i][0] == short_name) {
        section_index = i;
        active_section = sections[section_index][0];
        iframe.src = base_path+"/"+active_section+"/index.html";
      }
    }
  }


  self.each_section = function(callback) {
    for (var i = 0; i < sections.length; i++) {
      callback(sections[i][0], sections[i][1]);
    }
  }
}

})(cm.scorm = cm.scorm || {});