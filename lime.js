routes = [];
var lTimer = new LimeTimer();
lTimer.init();
function doRequest(key, data, priority = 1) {
  var id = generateRandomId(5);
  var request = new LimeRequest(key, data, priority);
  request.id = id;
  lTimer.getRequestQueue().addObject(request);
}
function getResponseById(id) {
  return lTimer.getResponseQueue.getResponseById(id);
}
function getResponseByKey(key) {
  return lTimer.getResponseQueue.getResponseByKey(key);
}
function generateRandomId(length) {
  var text = "";
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

  while(text.length < length)
    text += chars.charAt(Math.floor(Math.random() * chars.length));

  return text;
}
function addRoute(route) {
  for(var x = 0; x < routes.length; x++) {
    if(routes[x].key != route.key) {
      return null;
    }
  }
  routes[routes.length] = route;
  return route;
}

function LimeTimer() {
  this.init = function() {
    this.requestQueue = new this.Queue();
    this.responseQueue = new this.Queue();
    lime = this;
    this.threadId = setInterval(function() {lime.run(lime.requestQueue);}, 50);
  },
  this.run = function(requestQueue) {
    var request = requestQueue.get(0);
    if(request != undefined) {
      for(var x = 0; x < routes.length; x++) {
        var route = routes[x];
        requestQueue.removeObject(0);
        if(route.canHandle(request)) {
          var success = route.handle(request);
          if(success) {

          } else {
            console.log("Failed to obtain response for request:");
            console.log(request);
            console.log(" ");
          }
        }
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
  this.getResponsesByKey = function(key) {
    var responses = this.responseQueue.getObjectsByKey(key);
    if(responses != undefined && requests != null) {
      if(responses.length == 1)
        return responses[0];
      return responses;
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
  this.getResponsesById = function(id) {
    var responses = this.responseQueue.getObjectsById(id);
    if(responses != undefined && requests != null) {
      if(responses.length == 1)
        return responses[0];
      return responses;
    }
    return null;
  },
  this.getRequestQueue = function() {
    return this.requestQueue;
  },
  this.getResponseQueue = function() {
    return this.responseQueue;
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
    _limeHandler = this.handler;
    _limeErrorHandler = this.errorHandler;
    if(this.canHandle(request)) {
      $.ajax({
        url: this.url,
        data: request.data,
        success: function(data) {
          var response = new LimeResponse(request.key, data);
          response.id = request.id;
          _limeHandler(response);
          return true;
        },
        error: function(jqXHR, textStatus, errorThrown) {
          if(_limeErrorHandler != null)
            _limeErrorHandler(jqXHR, textStatus, errorThrown);
          return false;
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

var LimeResponse = function(key, data) {
  this.key = key;
  this.data = data;
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
