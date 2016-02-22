"use strict"

b4w.register("events", function(exports, require) {

exports.Listenable = function Listenable() {
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

exports.EventSystem = function(events) {
  var _this = this;

  this._listenables = new Object();
  for (var i = 0; i < events.length; i++) {
    _this._listenables[events[i]] = new exports.Listenable();
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

});