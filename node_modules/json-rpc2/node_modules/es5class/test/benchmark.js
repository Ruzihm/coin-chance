var
  Benchmark = require('Benchmark'),
  suite = new Benchmark.Suite,
  util = require('util'),
  Class = require('../'),
  base = {
    'args'      : {'Class': Class},
    'onComplete': function (event){
      console.log(String(event.target));
    },
    'onError'   : function (event){
      console.log(String(event.message));
    }
  };

suite
  .add('class instance function call',
    util._extend({
        fn   : function (){
          Cls.$create().test();
        },
        setup: function (){
          var Cls = this.args.Class.$define('cls', {
            'test': function (){
              return true;
            }
          });
        }
      },
      base
    )
  )
  .add('class method function call',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.$define('cls');
          Cls.$implement({
            'test': function (){
              return true;
            }
          });
        },
        fn   : function (){
          Cls.test();
        }
      },
      base
    )
  )
  .add('class instance included function call',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.$define('cls');
          Cls.$include({
            'test': function (){
              return true;
            }
          });
        },
        fn   : function (){
          Cls.$create().test();
        }
      },
      base
    )
  )
  .add('$super instance function calls',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.$define('cls', {
            test: function (){
              return true;
            }
          });
          var Clss = Cls.$define('clss', {
            test: function (){
              return this.$super();
            }
          });
        },
        fn   : function (){
          var $create = Clss.$create();
          $create.test();
        }
      },
      base
    )
  )
  .add('$super class function calls',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.$define('cls', {}, {
            test: function (){
              return true;
            }
          });

          Cls.$implement({
            test: function (){
              return this.$super();
            }
          });
        },
        fn   : function (){
          Cls.test();
        }
      },
      base
    )
  )
  .add('$super inherited two levels deep function calls',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.$define('cls', {}, {
            test: function (){
              return true;
            }
          });
          Cls.$implement({
            test: function (){
              return this.$super();
            }
          });
          var Two = Cls.$define('Two', {}, {
            test: function (){
              return this.$super();
            }
          });
        },
        fn   : function (){
          Two.test();
        }
      },
      base
    )
  )
  .add('class instantiation',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.$define('cls', {
            vibrate: function (){
              return true;
            }
          });
        },
        fn   : function (){
          var cls = Cls.$create();
          cls.vibrate();
        }
      },
      base
    )
  )
  .add('new instantiation',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.$define('Cls', {
            construct: function(ret) {
              this.ret = ret;
            },
            doIt: function(){
              return this.ret;
            }
          });
        },
        fn   : function (){
          (new Cls(true)).doIt();
        }
      },
      base)
  )
  .add('Auto instantiation',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.$define('Cls', {
            construct: function(ret) {
              this.ret = ret;
            },
            doIt: function(){
              return this.ret;
            }
          });
        },
        fn   : function (){
          Cls(true).doIt();
        }
      },
      base)
  )
  .run();