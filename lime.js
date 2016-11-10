function Lime(interval = 50) {
  this.version = "v1.0.13";
  this.routes = [];
  this.timer = new LimeTimer(this).init(interval);
  this.doRequest = function(key, data, options = {}) {
    var request = new LimeRequest(key, data, options.priority);
    request.id = function() {
      var text = "";
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

      while(text.length < 6)
        text += chars.charAt(Math.floor(Math.random() * chars.length));

      return text;
    }();
    this.timer.getRequestQueue().addObject(request);
    return request;
  }
  this.addRoute = function(route) {
    for(var x = 0; x < this.routes.length; x++) {
      if(this.routes[x].key != route.key) {
        console.log("Lime-Queue: A route was created with the same key as a previously created one.");
        console.log("Though this behavior is allowed, it is highly discouraged. Please consider having one route handling multiple tasks for the given data.");
      }
    }
    this.routes[this.routes.length] = route;
    return route;
  }
}

function LimeTimer(lime) {
  this.lime = lime;
  this.init = function(interval) {
    this.requestQueue = new this.Queue();
    this.responseQueue = new this.Queue();
    var timer = this;
    var f = timer.run;

    this.threadId = setInterval(timer.run.bind(timer, timer.requestQueue), interval);
    return this;
  },
  this.run = function(requestQueue) {
    var request = requestQueue.get(0);
    if(request != undefined) {
      for(var x = 0; x < this.lime.routes.length; x++) {
        var route = this.lime.routes[x];
        requestQueue.removeObject(0);
        if(route.canHandle(request))
          route.handle(request);
      }
    }
  },
  this.end = function() {
    clearInterval(this.threadId);
  },
  this.getRequestByKey = function(key) {
    var requests = this.requestQueue.getObjectsByKey(key);
    if(requests != undefined && requests != null) {
      if(requests.length == 1)
        return requests[0];
      return requests;
    }
    return null;
  },
  this.getRequestById = function(id) {
    var requests = this.requestQueue.getObjectsById(id);
    if(requests != undefined && requests != null) {
      if(requests.length == 1)
        return requests[0];
      return requests;
    }
    return null;
  },
  this.getRequestQueue = function() {
    return this.requestQueue;
  };
  this.Queue = function() {
    this.objects = [];
    this.addObject = function(object) {
      this.objects[this.objects.length] = object;
    },
    this.removeObject = function(x) {
      this.objects.splice(x, 1);
    },
    this.get = function(x) {
      return this.objects[x];
    },
    this.getObjects = function() {
      return this.objects;
    },
    this.getObjectsByKey = function(key) {
      var lobjects = [];
      for(var x = 0; x < this.getObjects(); x++) {
        if(this.getObjects()[x].key == key) {
          lobjects[lobjects.length] = this.getObjects()[x];
        }
      }
    },
    this.getObjectsById = function(id) {
      var lobjects = [];
      for(var x = 0; x < this.getObjects(); x++) {
        if(this.getObjects()[x].id == id) {
          lobjects[lobjects.length] = this.getObjects()[x];
        }
      }
    }
  };
}

var LimeMonitor = function(key, interval, handler, dataHandler, errorHandler = null, options = {}) {
  this.key = key;
  this.inteval = interval;
  this.handler = handler;
  this.dataHandler = dataHandler;
  this.errorHandler = errorHandler;
  this.options = options;
  this.handle = function() {
    var handler = this.handler;
    var errorHandler = this.errorHandler;
    var request = lime.doRequest(this.key, dataHandler());
    $.ajax({
      url: this.url,
      data: request.data,
      success: function(data) {
        var response = new LimeResponse(request.key, data);
        response.id = request.id;
        handler(response);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        if(errorHandler != null)
          errorHandler(jqXHR, textStatus, errorThrown);
      }
    });
    request.setHandled(true);
  }
}

var LimeRoute = function(key, url, handler, errorHandler = null, options = {}) {
  this.key = key;
  this.url = url;
  this.handler = handler;
  this.errorHandler = errorHandler;
  this.handle = function(request) {
    var _limeHandler = this.handler;
    var _limeErrorHandler = this.errorHandler;
    if(this.canHandle(request)) {
      $.ajax({
        url: this.url,
        data: request.data,
        success: function(data) {
          var response = new LimeResponse(request.key, data);
          response.id = request.id;
          _limeHandler(response);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          if(_limeErrorHandler != null)
            _limeErrorHandler(jqXHR, textStatus, errorThrown);
        }
      });
      request.setHandled(true);
    }
  },
  this.canHandle = function(request) {
    return request.key == this.key && !request.isHandled();
  },
  this.getKey = function() {
    return this.key;
  }
}

var LimeRequest = function(key, data, options = {}) {
  this.key = key;
  this.data = data;
  this.priority = options.priority;
  this.handled = false;
  this.getKey = function() {
    return this.key;
  },
  this.getData = function() {
    return this.data;
  },
  this.getData = function(key) {
    if(this.data == null || this.data == undefined)
      return null;
    for(var x = 0; x < this.data.length; x++) {
      if(this.data[x] == key) {
        return this.data[x];
      }
    }
  },
  this.setHandled = function(state) {
    this.handled = state;
  },
  this.isHandled = function() {
    return this.handled;
  }
}

var LimeResponse = function(key, data, options = {}) {
  this.key = key;
  this.data = data;
  this.getKey = function() {
    return this.key;
  },
  this.getData = function() {
    return this.data;
  },
  this.getData = function(key) {
    if(this.data == null || this.data == undefined)
      return null;
    for(var x = 0; x < this.data.length; x++) {
      if(this.data[x] == key) {
        return this.data[x];
      }
    }
  }
}
