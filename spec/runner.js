require.config({
    urlArgs:'bust=' + (new Date()).getTime(),
    map:{
        '*':{
            'src':'../src'
        }
    },
    shim:{
        'lib/conditioner':[
            'src/lib/Test.js',
            'src/lib/Condition.js',
            'src/lib/MonitorFactory.js',
            'src/lib/WebContext.js',
            'src/lib/UnaryExpression.js',
            'src/lib/BinaryExpression.js',
            'src/lib/ExpressionParser.js',
            'src/lib/ModuleRegistry.js',
            'src/lib/ModuleController.js',
            'src/lib/NodeController.js',
            'src/lib/SyncedControllerGroup.js',
            'src/lib/StaticModuleAgent.js',
            'src/lib/ConditionModuleAgent.js',
            'src/lib/ModuleLoader.js'
        ]
    }
});

require([

    // conditioner (makes sure all parts are loaded as shims)
    'lib/conditioner',

    // globals
    'lib/utils/Observer',
    'lib/utils/contains',
    'lib/utils/matchesSelector',
    'lib/utils/mergeObjects',
    'lib/utils/Promise',

    // utils
    'ObserverSpec.js',
    'extendClassOptionsSpec.js',

    // inner
    'ExpressionParserSpec',
    'MonitorFactorySpec',
    'ModuleLoaderSpec',

    // exposed
    'ModuleControllerSpec',
    'NodeControllerSpec',
    'SyncedControllerGroupSpec',

    // API
    'APISpec'

],function(c,Observer,contains,matchesSelector,mergeObjects,Promise){

    // setup base options
    window._options = {
        'paths':{
            'monitors':'mock/monitors'
        },
        'attr':{
            'options':'data-options',
            'module':'data-module',
            'conditions':'data-conditions',
            'priority':'data-priority',
            'initialized':'data-initialized',
            'processed':'data-processed',
            'loading':'data-loading'
        },
        'loader':{
            'require':function(paths,callback){
                require(paths,callback);
            },
            'config':function(path,options){
                var config = {};
                config[path] = options;
                requirejs.config({
                    config:config
                });
            },
            'toUrl':function(path) {
                return requirejs.toUrl(path);
            }
        },
        'modules':{}
    };

    // setup global monitor factory mock
    window._monitorFactory = new MonitorFactory();

    // globals required for inner library workings
    window.Observer = Observer;
    window.Promise = Promise;
    window.contains = contains;
    window.matchesSelector = matchesSelector;
    window.mergeObjects = mergeObjects;

    // run mocha
    (window.mochaPhantomJS ? window.mochaPhantomJS : mocha).run();
});