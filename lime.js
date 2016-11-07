function Lime() {
  this.routes = [];
  this.timer = new LimeTimer().init();
  this.doRequest = function(key, data, priority = 1) {
    var request = new LimeRequest(key, data, priority);
    request.id = function() {
      var text = "";
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

      while(text.length < 6)
        text += chars.charAt(Math.floor(Math.random() * chars.length));

      return text;
    }();
    lTimer.getRequestQueue().addObject(request);
  }
  function addRoute(route) {
    for(var x = 0; x < this.routes.length; x++) {
      if(this.routes[x].key != route.key) {
        return null;
      }
    }
    this.routes[this.routes.length] = route;
    return route;
  }
}

function LimeTimer() {
  this.init = function() {
    this.requestQueue = new this.Queue();
    this.responseQueue = new this.Queue();
    lime = this;
    this.threadId = setInterval(function() {lime.run(lime.requestQueue);}, 50);
    return this;
  },
  this.run = function(requestQueue) {
    var request = requestQueue.get(0);
    if(request != undefined) {
      for(var x = 0; x < routes.length; x++) {
        var route = routes[x];
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

var LimeRoute = function(key, url, handler, errorHandler = null) {
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

var LimeRequest = function(key, data, priority = 1) {
  this.key = key;
  this.data = data;
  this.priority = priority;
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

var LimeResponse = function(key, data) {
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
