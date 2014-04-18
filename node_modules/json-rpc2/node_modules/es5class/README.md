[![Build Status](https://travis-ci.org/pocesar/ES5-Class.png?branch=master)](https://travis-ci.org/pocesar/ES5-Class)
[![Coverage Status](https://coveralls.io/repos/pocesar/ES5-Class/badge.png?branch=master)](https://coveralls.io/r/pocesar/ES5-Class?branch=master)

[![NPM](https://nodei.co/npm/es5class.png?downloads=true)](https://nodei.co/npm/es5class/)

# ES5-Class
-----------

A Class object that enables native prototypal inheritance for Node and modern browsers.

Why should we write code like if we were in 2010? Read on!

* Inheritance made easy
* Uses `Object.setPrototypeOf` (when available, using `__proto__` when isn't), `Object.create` and `Object.defineProperty` ES5/ES6 methods to enable native prototypal inheritance with proper settings (enumerable, configurable, writable)
* Works with Node.js 0.8.x and up, and modern browsers.
* Functions to implement other class methods and include other instance/prototype methods
* The `$implement` method imports both prototype and class methods
* The `$include` method imports prototype methods, and class methods as prototype
* Takes advantage of ES5 non-writable properties to disable the possibility of messing up the classes
* Ability to inherit from multiple classes using arrays using `Class.$define('YourClass', [Class1, Class2, Class3])` without setting the `$parent` class, working like a mixin
* Call `this.$super` to reach the parent instance class function or extended class method
* Call `this.$parent` to reach the parent class definition
* Inject mixin code (as plain objects, functions or other classes) using `$include`/`$implement`
* Extend static class methods and properties with `$implement`
* `$implements` property contain all classes that were implemented into the current class
* The `construct` method is called with arguments when the class is instantiated
* `$class` is available everywhere, it returns the current class, even before instantiation
* You are free to instantiate your class using `Class.$create(arguments)`, `Class(arguments)` and `new Class(arguments)`
* It's freaking fast, check the benchmark section

__Contributors__

* [bfil](https://github.com/bfil)
* [pocesar](https://github.com/pocesar)

## Install
-----------

```bash
$ npm install es5class
```

```js
// then in your code
var Class = require('es5class');
```

## Support it

Like this module? Star it in github and do in your command line

```bash
$ npm star es5class
```

## Usage
-----------

### Creating a new class

```js
var Animal = Class.$define(
  // Class Name
  'Animal',
  // Prototype methods/variables, these will only be available through a class instance, in this case, through Animal.$create('Name')
  {
    construct: function (name){ // this is called automatically on instantiation
      this.name = name;
    },
    getName  : function (){
      return this.name;
    }
  },
  // Class methods/variables, this will only be available through Animal, as in Animal.count or Animal.getCount()
  {
    count   : 0,
    getCount: function (){
      return this.count;
    }
  }
);
```

### Class inheritance

```js
var Bird = Animal.$define('Bird', {
  construct: function (name, canFly){
    if (canFly) {
      this.canFly = canFly;
    }
    this.$super(name + ' Bird'); // calls parent class constructor, calls Animal.prototype.construct and set this.name = 'Yellow ' + name
  },
  canFly   : false
});
```

### Extending a prototype

```js
Bird.$include({ // include is like doing _.extend(Bird.prototype, {}) but with proper wrapping the methods for $super access
  fly: function (){
    if (this.canFly) {
      console.log(this.name + ' flies!');
    } else {
      console.log(this.name + ' cant fly');
    }
  }
});
```

### Implement

```js
// "Implement" import prototype (if any) and class methods from the given object, to the class declaration and the prototype
var
    Class1 = Class.$define('Class1'),
    obj = {yup: true},
    h = function(){};

h.prototype.nope = false;

Class1.$implement([obj, h]);

console.log(Class1.yup); // true (imported to the class declaration)
console.log(Class1.$create().nope); // false (imported to the prototype)
```

You can all the inheriting class construct by passing the second parameter, for example:

```js
var EventEmitter = require('events').EventEmitter;

// this code is the same as
Class.$define('MyEventEmitter', function(){
    this.$implement(EventEmitter);

    return {
        construct: function(){
            EventEmitter.call(this);
        }
    };
});

// this one (much cleaner)
Class.$define('MyEventEmitter').$implement(EventEmitter, true);

// There's no need for the construct + implement if you are just creating an inheritance from another Node.js class
// So it's easier to set the second parameter of implement to true, it will call the parent class constructor
// automatically
```

Because it's really easy to forget to initialize the inheriting class

### Include

```js
// "Implement" import class methods *ONLY* from the given object, to the class declaration prototype *ONLY*
var
    Class1 = Class.$define('Class1'),
    obj = {yup: true},
    h = function(){};

h.prototype.nope = false;
h.yep = false;

Class1.$include([obj, h]);

console.log(Class1.$create().yup); // true (imported to the prototype)
console.log(Class1.nope); // undefined (not imported since it's in the prototype of the "h" object)
console.log(Class1.$create().nope); // undefined (not imported since it's in the prototype of the "h" object)
console.log(Class1.$create().yep); // false (imported to the prototype since it's in the declaration of the "h" object)
```

#### Inherit from any existing Node.js class

```js
var MyEventClass = Class.$define('MyEventEmitter', function(){
  var base = this;
  base.$implement(require('events').EventEmitter); // inherit from EventEmitter

  return {
      construct: function(){
          var self = this;
          process.nextTick(function(){
              self.emit('created', base); // we can use it in construct already!
          });
      }
  };
});

MyEventClass.$create().on('created', function(base){
    expect(base).to.eql(MyEventClass);
    expect(base.prototype.on).to.be.a('function');
});
```

### Encapsulate logic by passing a closure

```js
Bird.$include(function ($super){ // $super is the Animal prototype (the parent), it contains only "construct" and "getName" per definitions above
  var timesBeaked = 0;
  // "this" refers to the current Class definition, that is, Bird, so you can access
  // static variables plus the prototype, before it's [re]defined
  //
  // this.prototype.getName();
  // this.count
  //
  // you may want to set var self = this; for usage inside the functions
  return {
    beak: function (){
      return ++timesBeaked;
    }
  };
});

Bird.$implement(function ($super){ // $super is the Animal class itself (the parent)
  // "this" refers to the current Class definition, the same way it happens
  // when extending the prototype (using $include), you may access this.prototype in
  // here as well
  var catalog = {};
  return {
    catalog: function (bird){ // Bird.catalog() is now available
      if (arguments.length) {
        for(var i = 0; i < arguments.length; i++) {
          catalog[arguments[i].name] = arguments[i];
        }
      }
      return catalog;
    }
  };
});
```

### Extending a class

```js
// These functions and values persist between class creation, serve as static methods
Animal.$implement({
    run: function() {
        for(var i=1; i<=10; i++) {
            this.ran++; // this refer to the current class definition (either Dog, Animal or Cat)
            // you may change it to Animal.ran to make the same value available to all classes
            // also, you may use the this.$parent.ran to set it always on the Animal class when
            // calling on extended classes (Dog and Cat)
            console.log("Animal ran for " + i + " miles!");
        }
    },
    ran: 0
});

var Dog = Animal.$define('Dog');
Animal.run(); // Dog.ran and Animal.ran are 10
var Cat = Animal.$define('Cat');
Cat.run(); // Cat.ran is 20, Dog.ran and Animal.ran are 10
Dog.run(); //
Dog.run(); // Cat.ran is 20, Dog.ran is 30 and Animal.ran is 10

// If you implement the same method, you can update the parent using this.$parent
// If you want to update the parent value, you can also use this.$parent.ran
Dog.$implement({
    run: function(){
        this.ran += 10;
        this.$parent.run(); // Animal.ran is now 20
    }
});

Dog.run(); // Dog.ran is now 40, Animal.ran and Cat.ran are now 20
```

### Creating an instance

```js
var animal = Animal.$create("An Animal");
var bird = Bird.$create("A Bird");
var bird2 = Bird("Another bird");
var bird3 = new Bird("Also a bird");
```

### Checking instances

```js
animal.$instanceOf(Animal); // true
animal.$instanceOf(Bird);   // false
bird.$instanceOf(Animal);   // true
bird.$instanceOf(Bird);     // true
bird.$instanceOf(Class);    // true
```

### Other useful methods and properties

```js
Animal.$className;                // 'Animal'
bird.$class;                      // returns the Bird class definition, you can do a $class.$create('instance', 'params')
bird.$class.$className            // 'Bird'
bird.$class.$parent.$className    // 'Animal'
bird.$parent.$className           // 'Animal'
bird.$parent.$parent.$className   // 'ES5Class'
bird.$isClass(Bird);              // true
Animal.$isClass(Bird);            // false
```

### Mixin from other classes

```js
var Class1 = Class.$define('Class1', {}, {done: true}),
    Class2 = Class.$define('Class2', {func: function(){ return true; }}),
    Class3 = Class.$define('Class3', {}, {yet: true});

// This mix in the whole class (prototype and class methods)
var NewClass = Class.$define('NewClass', {}, [Class1, Class2, Class3]);

// Pay attention that it needs to go in the second parameter if you want
// to copy the object properties AND the prototype properties

// or using NewClass.$implement([Class1, Class2, Class3]);

Class1.done = false; // Changing the base classes doesn't change the mixin'd class

console.log(NewClass.done); // true
console.log(NewClass.yet); // true
console.log(NewClass.$parent); // ES5Class
console.log(NewClass.$implements); // [Class1,Class2,Class3]
console.log(NewClass.$create().func()); // true
console.log(NewClass.$create().$class.done); // true

// This mix in class methods as prototypes
NewClass = Class.$define('NewClass', [Class1, Class2, Class3]);

console.log(NewClass.$create().yet); // true
console.log(NewClass.$create().done); // false
console.log(NewClass.$create().func); // undefined
```

### Singletons

```js
var Singleton = Class.$define('Singleton', {}, {
    staticHelper: function(){
        return 'helper';
    },
    staticVariable: 1
});

var ExtraSingleton = Class.$define('Extra');
ExtraSingleton.$implement(Singleton);
ExtraSingleton.$implement({
    extra: true
});

ExtraSingleton.staticHelper() // outputs 'helper'
Singleton.extra // undefined
ExtraSingleton.extra // true
ExtraSingleton.staticVariable // 1
```

### Share data between instances (flyweight pattern)

```js
var Share = Class.$define('Share', function(){
    var _data = {}; //all private data, that is shared between each Share.$create()

    return {
        construct: function(){
            this.$class.count++;
        },
        append: function(name, data){
          _data[name] = data;
        }
    }
}, {
    count: 0 // exposed variable
});
var one = Share.$create('one'), two = Share.$create('two'); // Share.count is now 2
one.append('dub', true); // _data is now {'dub': true}
two.append('dub', false); // _data is now {'dub': false}
two.append('bleh', [1,2,3]); // _data is now {'dub': false, 'bleh': [1,2,3]}
```

### Duck typing (nothing stops you to not using inheritance and decoupling classes)

```js
var Op = Class.$define('Op', {
    construct: function (number){
      this.number = number;
    },
    operator : function (number){
      return number;
    }
  });

  var Mul = Op.$define('Multiply', {
    operator: function (number){
      return number * this.number;
    }
  });

  var Div = Op.$define('Divide', {
    operator: function (number){
      return number / this.number;
    }
  });

  var Sum = Op.$define('Sum', {
    operator: function (number){
      return number + this.number;
    }
  });

  var Operation = Class.$define('Operation', {}, function (){
    var
      classes = [],
      number = 0;

    return {
      add     : function (clss){
        for (var i = 0, len = clss.length; i < len; i++) {
          classes.push(clss[i]);
        }
        return this;
      },
      number  : function (nmbr){
        number = nmbr;
        return this;
      },
      result  : function (){
        var result = number;
        for (var i = 0, len = classes.length; i < len; i++) {
          result = classes[i].operator(result);
        }
        return result;
      },
      onthefly: function (classes){
        var result = number;
        for (var i = 0, len = classes.length; i < len; i++) {
          result = classes[i].operator(result);
        }
        return result;
      }
    };
  });

  var sum = Sum.$create(40);
  var mul = Mul.$create(50);
  var div = Div.$create(20);
  Operation.number(100);
  Operation.add([sum, mul, div]).result(); // Result is 350
  var mul2 = Mul.$create(30);
  Operation.onthefly([div, sum, mul, mul2]); // Result is 67500
```

For a lot of class examples (inheritance, extending, singletons, etc), check the test sources at `test/class-test.js`

## Running the tests
-----------

The tests are ran using [mocha](https://github.com/visionmedia/mocha)

```bash
$ npm install && npm run test
```

## Benchmark
-----------

Check how this library perform on your machine

```bash
$ npm install && npm run benchmark
```

A benchmark result in a 1st gen Core i3:

```
class instance function call x 1,598,593 ops/sec ±1.33% (92 runs sampled)
class method function call x 113,626,665 ops/sec ±4.11% (63 runs sampled)
class instance included function call x 1,612,332 ops/sec ±1.48% (92 runs sampled)
$super instance function calls x 543,054 ops/sec ±3.79% (81 runs sampled)
$super class function calls x 11,954,826 ops/sec ±0.64% (97 runs sampled)
$super inherited two levels deep function calls x 5,852,093 ops/sec ±0.30% (95 runs sampled)
class instantiation x 1,257,516 ops/sec ±1.11% (93 runs sampled)
new instantiation x 2,992,584 ops/sec ±0.53% (96 runs sampled)
Auto instantiation x 1,276,445 ops/sec ±1.11% (93 runs sampled)
```

## Feeback
-----------

Please use the issues section of github to report any bug you may find

## License
-----------

(The MIT License)

Copyright (c) 2011 Bruno Filippone

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.