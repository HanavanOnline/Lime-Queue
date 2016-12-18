Array.prototype.indexOf || (Array.prototype.indexOf = function(d, e) {
    var a;
    if (null == this) throw new TypeError('"this" is null or not defined');
    var c = Object(this),
        b = c.length >>> 0;
    if (0 === b) return -1;
    a = +e || 0;
    Infinity === Math.abs(a) && (a = 0);
    if (a >= b) return -1;
    for (a = Math.max(0 <= a ? a : b - Math.abs(a), 0); a < b;) {
        if (a in c && c[a] === d) return a;
        a++
    }
    return -1
});
function Lime(interval = 50) {
  this.version = "v1.1.7";
  this.routes = [];
  this.timer = new LimeTimer(this).init(interval);
  this.doRequest = function(key, data = "", options = {}) {
    if(key.includes(" ")) {
      var requests = key.split(" ");
      for(var x = 0; x < requests.length; x++) {
        this.doRequest(requests[x], data, options);
      }
      return;
    }
    var request = new LimeRequest(key, data, options.priority);
    request.id = function() {
      var text = "";
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

      while(text.length < 6)
        text += chars.charAt(Math.floor(Math.random() * chars.length));

      return text;
    }();
    if(options.id != undefined) {
      request.id = options.id;
    }
    if(options.method != undefined) {
      request.method = options.method;
    }
    this.timer.getRequestQueue().addObject(request);
    return request;
  }
  this.addRoute = function(route) {
    if(route.key.includes(" ")) {
      console.log("Lime-Queue: Routes CANNOT have non-alphanumeric characters (besides '-' and '_') in their keys! Please modify your route key for Route with key: \"" + route.key + "\".");
      return;
    }
    for(var x = 0; x < this.routes.length; x++) {
      if(this.routes[x].key == route.key) {
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
        requestQueue.removeObject(request);
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
    this.removeObject = function(e) {
      var x = this.objects.indexOf(e);
      if (x > -1) {
        this.objects.splice(x, 1);
      }
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

var LimeRoute = function(key, url, handler, errorHandler = null, options = {}) {
  this.key = key;
  this.url = url;
  this.handler = handler;
  this.errorHandler = errorHandler;
  this.handle = function(request) {
    var _limeHandler = this.handler;
    var _limeErrorHandler = this.errorHandler;
    var data = request.data;
    if(typeof data == "function"){
      data = data();
      request.data = data;
    }
    var url = this.url;
    if(typeof url == "function")
      url = url(request);
    if(this.canHandle(request)) {
      var body = {
        url: url,
        data: request.data,
        success: function(data) {
          data = $.parseJSON(data);
          var response = new LimeResponse(request.key, data, request);
          response.id = request.id;
          _limeHandler(response);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          if(_limeErrorHandler != null)
            _limeErrorHandler(jqXHR, textStatus, errorThrown);
        }
      };
      if(request.options != undefined && request.method != undefined)
        body.method = request.method;
      if(options != undefined && options.method != undefined)
        body.method = options.method;
      $.ajax(body);
      request.setHandled(true);
    }
  },
  this.canHandle = function(request) {
    if(this.key instanceof Array) {
      for(var x in this.key) {
        if(request.key == x)
          return !request.isHandled();
      }
    }
    if(typeof this.key == "function") {
      var tmp = this.key();
      if(tmp instanceof Array) {
        for(var x in tmp)
          if(x == request.key)
            return !request.isHandled();
      } else {
        return request.key == tmp;
      }
    }
    return request.key == this.key && !request.isHandled();
  },
  this.getKey = function() {
    return this.key;
  }
}

var LimeRequest = function(key, data = "", options = {}) {
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

var LimeResponse = function(key, data, request, options = {}) {
  this.key = key;
  this.data = data;
  this.request = request;
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
