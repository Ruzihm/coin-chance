'use strict';

var
  Class = require('..');

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

var Bird = Animal.$define('Bird', {
  construct: function (name, canFly){
    if (canFly) {
      this.canFly = canFly;
    }
    this.$super(name + ' Bird'); // calls parent class constructor, calls Animal.prototype.construct and set this.name = 'Yellow ' + name
  },
  canFly   : false
});

Bird.$include({ // include is like doing _.extend(Bird.prototype, {}) but with proper wrapping the methods for $super access
  fly: function (){
    if (this.canFly) {
      console.log(this.name + ' flies!');
    } else {
      console.log(this.name + ' cant fly');
    }
  }
});

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

var swallow  = Bird.$create('Swallow', true);
swallow.fly();
var ostrich = Bird.$create('Ostrich');
ostrich.fly();
console.log(Bird.catalog(swallow, ostrich));


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