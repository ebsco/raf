define(function(require, exports, module) {
  var now = (function () {
    var loadTime
    , func = function () {
      return Date.now() - loadTime
    };

    loadTime = Date.now()
    return func;
  })()
    , global = typeof window === 'undefined' ? {} : window
    , vendors = ['moz', 'webkit']
    , suffix = 'AnimationFrame'
    , raf = global['request' + suffix]
    , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]

  for(var i = 0; i < vendors.length && !raf; i++) {
    raf = global[vendors[i] + 'Request' + suffix]
    caf = global[vendors[i] + 'Cancel' + suffix]
        || global[vendors[i] + 'CancelRequest' + suffix]
  }

  // Some versions of FF have rAF but not cAF
  if(!raf || !caf) {
    var last = 0
      , id = 0
      , queue = []
      , frameDuration = 1000 / 60

    raf = function(callback) {
      if(queue.length === 0) {
        var _now = now()
          , next = Math.max(0, frameDuration - (_now - last))
        last = next + _now
        setTimeout(function() {
          var cp = queue.slice(0)
          // Clear queue here to prevent
          // callbacks from appending listeners
          // to the current frame's queue
          queue.length = 0
          for(var i = 0; i < cp.length; i++) {
            if(!cp[i].cancelled) {
              try{
                cp[i].callback(last)
              } catch(e) {
                setTimeout(function() { throw e }, 0)
              }
            }
          }
        }, Math.round(next))
      }
      queue.push({
        handle: ++id,
        callback: callback,
        cancelled: false
      })
      return id
    }

    caf = function(handle) {
      for(var i = 0; i < queue.length; i++) {
        if(queue[i].handle === handle) {
          queue[i].cancelled = true
        }
      }
    }
  }

  module.exports = function(fn) {
    // Wrap in a new function to prevent
    // `cancel` potentially being assigned
    // to the native rAF function
    return raf.call(global, fn)
  }
  module.exports.cancel = function() {
    caf.apply(global, arguments)
  }

});
