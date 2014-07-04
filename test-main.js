var allTestFiles = [];
var TEST_REGEXP = /(spec)\.js$/i;

var pathToModule = function(path) {
    return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file)) {
        allTestFiles.push(pathToModule(file));
    }
});

console.info('\n\nLoading tests:\n' + allTestFiles.join(', \n') + '\n');

require.config({
    baseUrl:'base',
    paths:{
        'mock':'spec/mock',
        'lib':'src'
    }
});

require([
    'lib/utils/Observer',
    'lib/utils/Promise',
    'lib/utils/contains',
    'lib/utils/matchesSelector',
    'lib/utils/mergeObjects',
    'lib/utils/extendClassOptions',
    'lib/factory'
],function(Observer,Promise,contains,matchesSelector,mergeObjects,extendClassOptions,factory){

    // setup base options
    window._options = {
        'paths':{
            'monitors':'mock/monitors/'
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
    window.extendClassOptions = extendClassOptions;

    // setup factory for API test
    window.conditioner = factory;

    // run test files
    require(allTestFiles,function(){
        window.__karma__.start();
    });

});