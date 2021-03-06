tabris.Events = {

  on: function(type, callback, context) {
    return this._on(type, callback, context, true);
  },

  off: function(type, callback, context) {
    return this._off(type, callback, context, true);
  },

  _on: function(type, callback, context, isPublic) {
    this._checkDisposed();
    var store = isPublic ? "_callbacks" : "_privateCallbacks";
    var wasListening = this._isListening(type);
    if (!this[store]) {
      this[store] = [];
    }
    this[store][type] = (this[store][type] || []).concat([
      {
        fn: callback,
        ctx: context
      }
    ]);
    if (!wasListening) {
      this._listen(type, true);
    }
    return this;
  },

  _off: function(type, callback, context, isPublic) {
    this._checkDisposed();
    var store = isPublic ? "_callbacks" : "_privateCallbacks";
    if (this[store]) {
      if (!type) {
        delete this[store];
      } else if (type in this[store]) {
        if (!callback) {
          delete this[store][type];
        } else {
          var callbacks = this[store][type].concat();
          for (var i = callbacks.length - 1; i >= 0; i--) {
            if ((callbacks[i].fn === callback || callbacks[i].fn._callback === callback) &&
              (!context || callbacks[i].ctx === context)) {
              callbacks.splice(i, 1);
            }
          }
          if (callbacks.length === 0) {
            delete this[store][type];
            if (Object.keys(this[store]).length === 0) {
              delete this[store];
            }
          } else {
            this[store][type] = callbacks;
          }
        }
      }
    }
    if (!this._isListening(type)) {
      this._listen(type, false);
    }
    return this;
  },

  once: function(type, callback, context) {
    this._checkDisposed();
    var self = this;
    var wrappedCallback = function() {
      self.off(type, wrappedCallback, context);
      callback.apply(this, arguments);
    };
    wrappedCallback._callback = callback;
    return this.on(type, wrappedCallback, context);
  },

  trigger: function(type /*, args* */) {
    this._checkDisposed();
    var args = Array.prototype.slice.call(arguments, 1);
    this._callAll(type, args, false);
    this._callAll(type, args, true);
    return this;
  },

  _callAll: function(type, args, isPublic) {
    var store = isPublic ? "_callbacks" : "_privateCallbacks";
    if (this[store] && type in this[store]) {
      var callbacks = this[store][type];
      for (var i = 0; i < callbacks.length; i++) {
        var callback = callbacks[i];
        callback.fn.apply(callback.ctx || this, args);
      }
    }
  },

  _isListening: function(type) {
    return (!!this._callbacks && (!type || type in this._callbacks)) ||
      (!!this._privateCallbacks && (!type || type in this._privateCallbacks));
  },

  _checkDisposed: function() {},
  _listen: function() {}

};

util.extend(tabris, tabris.Events);
