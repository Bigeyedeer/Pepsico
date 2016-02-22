var cm = cm || parent.cm || {};

(function(events) {

events.Listenable = function Listenable() {
  var listeners = new Array();

  this.add_listener = function(listener) {
    listeners.push(listener);
  }

  this.remove_listener = function(listener) {
    if (listeners.length < 1)
      return false;
    for (var i = 0; i < listeners.length; i++) {
      if (listeners[i] == listener) {
        listeners.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  this.dispatch_event = function(data) {
    for (var i = 0; i < listeners.length; i++) {
      listeners[i](data);
    }
  }
}

events.EventSystem = function(_events) {
  var _this = this;

  this._listenables = new Object();
  for (var i = 0; i < _events.length; i++) {
    _this._listenables[_events[i]] = new events.Listenable();
  }

  this.add_listener = function(name, listener) {
    if (!_this._listenables[name]) {
      console.log("Could not add_listener. No such event exists.");
      return;
    }
    _this._listenables[name].add_listener(listener);
  }

  this.remove_listener = function(name, listener) {
    if (!_this._listenables[name]){
      console.log("Could not remove_listener. No such event exists.");
      return;
    }
    _this._listenables[name].remove_listener(listener);
  }

  this.dispatch_event = function(name, data) {
    if (!_this._listenables[name]) {
      console.log("Could not dispatch_event. No such event exists.");
      return;
    }
    _this._listenables[name].dispatch_event(data);
  }
}

}(cm.events = cm.events || {}));
