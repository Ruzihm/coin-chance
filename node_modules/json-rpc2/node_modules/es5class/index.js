/**
 * @version 1.1.1
 */
'use strict';

var
  hwp = Object.prototype.hasOwnProperty,
  gpd = Object.getOwnPropertyDescriptor,
  noop = function noop(){},
  spo = Object.setPrototypeOf || function spo(obj, proto){
    obj.__proto__ = proto;
    return obj;
  },
  isArray = function isArray(obj){
    return obj && obj.constructor === Array;
  },
  isFunction = function isFunction(obj){
    return obj && obj.constructor === Function;
  },
  isPlainFunction = function isPlainFunction(object){
    return isFunction(object) &&
      (object['prototype'] === undefined || Object.keys(object.prototype).length === 0) &&
      object['$class'] === undefined;
  },
  superApply = function superApply(instance, object, args){
    if (object.$apply.length) {
      object.$apply.forEach(function eachApply(f){
        if (f.apply) {
          // dirty little hack to make classes like Buffer think the prototype is instanceof itself
          spo(instance, f.prototype);
          f.apply(instance, args);
        }
      });
    }
  },
  splat = function splat(obj, context, args){
    obj.$arguments = args;

    if (args.length > 0) {
      switch (args.length) {
        case 1:
          return obj[context](obj.$arguments[0]);
        case 2:
          return obj[context](obj.$arguments[0], obj.$arguments[1]);
        case 3:
          return obj[context](obj.$arguments[0], obj.$arguments[1], obj.$arguments[2]);
        case 4:
          return obj[context](obj.$arguments[0], obj.$arguments[1], obj.$arguments[2], obj.$arguments[3]);
        case 5:
          return obj[context](obj.$arguments[0], obj.$arguments[1], obj.$arguments[2], obj.$arguments[3], obj.$arguments[4]);
        default:
          return obj[context].apply(context, obj.$arguments);
      }
    } else {
      return obj[context]();
    }
  },
  hasSuperRegex = /\$super/,
  functionWrapper = function functionWrapper(key, obj, original){
    /*
     performance gain:
     476% on Class method calls
     40% on more than 1 level $super calls
     120% on instance and method $super calls
     42% on instance calls

     this function call happens only once when creating the class
     but the wrapper calls 2 functions instead of one
     so only wrap it when needed
     */

    if (!hasSuperRegex.test(obj[key])) {
      return obj[key];
    }
    return function wrapped(){
      var originalSuper, ret, self = this;

      originalSuper = self.$super; // store current $super

      // if we have an original, it's a Class method call, otherwise, let's look for the parent, or use an empty function
      self.$super = original || self.$parent[key] || noop;

      if (arguments.length) {
        ret = obj[key].apply(self, arguments);
      } else {
        ret = obj[key].call(self);
      }

      // restore the upper $super
      self.$super = originalSuper;

      return ret;
    };
  },
  /**
   * Base class that should define other classes
   *
   * @constructor
   */
    ES5Class = function ES5Class(){ };

ES5Class.prototype = {
  construct: noop
};

/**
 * Define a new class
 *
 * @param {String} className The name of the class
 * @param {Object|Function} [include] Your class prototype functions and variables or closure
 * @param {Object|Function} [implement] Your class static methods or closure
 *
 * @example
 * <pre>
 *   var NewClass = ES5Class.$define('name', {
 *     construct: function(){
 *     }
 *   }, {
 *     static: 1
 *   });
 *   // If you use a function, you need to return an object
 *   var NewClass = ES5Class.$define('name', function(){
 *    // private variables
 *
 *    return {
 *      construct: function(){
 *      }
 *    };
 *   });
 * </pre>
 *
 * @throws Error
 * @return {ES5Class}
 */
Object.defineProperty(ES5Class, '$define', {
  value: function $define(className, include, implement) {
    var
      self = this, object, isClass, getClass;

    if (!className) {
      throw new Error('Class name must be specified');
    }

    object = function constructor(){
      if (!(this instanceof object)) {
        // auto instantiation
        return splat(object, 'create', arguments);
      }

      superApply(this, object, arguments);

      spo(this, object.prototype); // always need to restore prototype after superApply

      // old school new operator, call the constructor
      if (this.construct && this.construct !== noop) {
        splat(this, 'construct', arguments);
      }

      return this;
    };

    spo(object, self);

    getClass = (function (Class){
      return function getClass(){
        return Class;
      };
    })(object);

    isClass = (function (object){
      return function isClass(cls){
        return cls && object &&
          cls['prototype'] !== undefined &&
          object['prototype'] !== undefined &&
          cls['$className'] !== undefined &&
          object['$className'] !== undefined &&
          cls.$className === object.$className &&
          cls.prototype === object.prototype;
      };
    })(object);

    Object.defineProperties(object, {
      '$className' : {
        get: (function (className){
          return function $className(){
            return className;
          };
        })(className)
      },
      'constructor': object,
      '$parent'    : {
        value: (function (object){
          return object;
        })(self)
      },
      '$apply'     : {
        value   : [],
        writable: true
      },
      '$implements': {
        value   : [],
        writable: true
      },
      '$isClass'   : {
        value: isClass
      },
      '$class'     : {
        get: getClass
      },
      'prototype'  : {
        value: (function (prototype){
          return prototype;
        })(Object.create(self.prototype, {
            constructor  : {
              get: getClass
            },
            '$implements': {
              'get': (function (object){
                return function $implements(){
                  return object.$implements;
                };
              })(object)
            },
            '$parent'    : {
              value: (function (object){
                return object;
              })(self.prototype)
            },
            '$class'     : {
              'get': getClass
            },
            '$isClass'   : {
              value: isClass
            }
          }))
      }
    });

    if (implement) {
      object.$implement(implement);
    }

    if (include) {
      object.$include(include);
    }

    return object;
  }
});
/**
 * @deprecated
 * @type {Function}
 */
ES5Class.define = ES5Class.$define;

/**
 * Create a new instance of your class
 *
 * @instance
 * @return {ES5Class}
 */
Object.defineProperty(ES5Class, '$create', {
  value: function $create(){
    var
      self = this,
      instance = Object.create(Object.prototype);

    superApply(instance, self, arguments);

    spo(instance, self.prototype); // always need to restore prototype after superApply

    if (instance.construct && instance.construct !== noop) {
      splat(instance, 'construct', arguments);
    }

    return instance;
  }
});
/**
 * @deprecated
 * @type {Function}
 */
ES5Class.create = ES5Class.$create;

/**
 * Add, override or overload prototype methods of the class
 *
 * @param {Object|Function} obj The definition object or closure
 *
 * @return {ES5Class}
 */
Object.defineProperty(ES5Class, '$include', {
  value: function $include(obj){
    var self = this, wrap, newfunc, descriptor;

    if (obj !== undefined && obj !== null && self.prototype) {
      if (isArray(obj)) {
        for (var i = 0, len = obj.length; i < len; i++) {
          // An array of either a function, ES5Class or plain objects
          self.$include(obj[i]);
        }
      } else if (
        isPlainFunction(obj) &&
          (typeof (newfunc = obj.call(self, self.$parent.prototype)) === 'object')
        ) {
        // Include the result of the closure if it's not null/undefined
        self.$include(newfunc);
      } else {
        for (var key in obj) {
          if (hwp.call(obj, key)) {
            descriptor = gpd(obj, key);
            if (descriptor !== undefined && (descriptor.set || descriptor.get)){
              Object.defineProperty(self.prototype, key, descriptor);
            } else if (obj[key] !== undefined) {
              if (obj[key] !== null && obj[key]['$class'] !== undefined) {
                // ES5Class, start over
                self.$include(obj[key]);
              } else if (isFunction(obj[key])) {
                // Wrap function for $super
                wrap = functionWrapper(key, obj, isFunction(self.prototype[key]) ? self.prototype[key] : noop);

                self.prototype[key] = wrap;
              } else {
                // Not a function, copy it over
                self.prototype[key] = obj[key];
              }
            }
          }
        }
      }
    }

    return self;
  }
});
/**
 * @deprecated
 * @type {Function}
 */
ES5Class.include = ES5Class.$include;

/**
 * Add, override or overload static methods to the class
 *
 * @param {Object|Function} obj The definition object or closure
 * @param {Boolean} apply When implementing other Node.js classes, you can automatically apply their constructors by passing true to this parameter
 * @param {Boolean} importing Is being called from an instantiated class, the mixin is made per instance and not globally
 * @param {Boolean} both Should import both prototype and properties
 *
 * @return {ES5Class}
 */
Object.defineProperty(ES5Class, '$implement', {
  value: function $implement(obj, apply, importing, both){
    var self = this, func, newfunc, descriptor;

    if (obj !== undefined && obj !== null) {
      if (isArray(obj)) {
        // Classes/objects should be mixed in
        for (var i = 0, len = obj.length; i < len; i++) {
          self.$implement(obj[i], apply);
        }
      } else if (
        isPlainFunction(obj) &&
          (typeof (newfunc = obj.call(self, self.$parent)) === 'object')
        ) {
        // Class should implement the closure result only
        // if the function returns something
        self.$implement(newfunc, apply);
      } else {
        if (
          obj['$implements'] !== undefined &&
            isArray(obj.$implements)
          ) {
          // Keep track of mixin'd classes
          self.$implements.push(obj);
        }

        for (var key in obj) {
          descriptor = gpd(obj, key);
          if (descriptor !== undefined && (descriptor.set || descriptor.get)){
            Object.defineProperty(self, key, descriptor);
          } else if (obj[key] !== undefined) {
            if (key !== 'prototype') {
              if (obj[key] !== null && obj[key]['$class'] !== undefined) {
                // One of the members is a ES5Class
                self.$implement(obj[key], apply);
              } else {
                if (isFunction(obj[key])) {
                  // Wrap the function for $super usage
                  func = functionWrapper(key, obj, isFunction(self[key]) ? self[key] : noop);

                  self[key] = func;
                } else {
                  // Not a function, just copy the value
                  self[key] = obj[key];
                }
              }
            }
          }
        }

        if (obj.prototype !== undefined && obj.prototype !== null && (!importing && !both)) {
          if (apply && self.$apply.indexOf(obj) === -1) {
            self.$apply.push(obj);
          }
          // Current object has a prototype (be it a ES5Class or not), let's
          // include them in our class definition
          if (both) {
            self.$implement(obj.prototype);
          } else {
            self.$include(obj.prototype);
          }
        }
      }
    }

    return self;
  }
});
/**
 * @deprecated
 * @type {Function}
 */
ES5Class.implement = ES5Class.$implement;

/**
 * Current version
 */
Object.defineProperty(ES5Class, '$version', {
  value: '1.1.1'
});

/**
 * Get the current class name.
 *
 * Gets overwritten in define
 *
 * @typedef {String} $className
 */
Object.defineProperty(ES5Class, '$className', {
  get: function $className(){
    return 'ES5Class';
  }
});

/**
 * Get the current class definition created with ES5Class.$define
 * Accessed by this.$class.
 *
 * Gets overwritten on define
 *
 * @typedef {Object} $class
 */
Object.defineProperty(ES5Class.prototype, '$class', {
  get: function $class(){
    return ES5Class;
  }
});

/**
 * Cleanup any variables that might hold external objects on the class before getting rid of it
 */
Object.defineProperty(ES5Class.prototype, '$destroy', {
  value: function $destroy(){
    var self = this, k;
    self.$arguments = null;
    for (k in self) {
      self[k] = null;
    }
  },
  configurable: true
});
/**
 * Exchanges current proto for something else.
 * The original chain is lost
 *
 * @param {Object|Function} obj Object that has a prototype to exchange to
 * @param {Array} params Params for calling the original constructor
 * @type {Function}
 */
Object.defineProperty(ES5Class.prototype, '$exchange', {
  value: function $exchange(obj, args){
    if (isFunction(obj) && obj.prototype !== undefined) {
      var _args = this.$arguments;
      this.__proto__ = obj.prototype;
      obj.apply(this, args || _args);
    }
    return this;
  }
});

Object.defineProperty(ES5Class.prototype, '$import', {
  value: function $import(obj, both){
    ES5Class.$implement.call(this, obj, null, true, both);
    return this;
  }
});

/**
 * Returns true if the current instance is an instance of the class
 * definition passed parameter
 *
 * @function $instanceOf
 */
Object.defineProperty(ES5Class.prototype, '$instanceOf', {
  value: function $instanceOf(object){
    return object && object.prototype && (object.prototype.isPrototypeOf ? object.prototype.isPrototypeOf(this) : false);
  }
});

if (module !== undefined && module.exports) {
  module.exports = ES5Class;
}
