require.config({
    map:{
        '*':{
            'conditioner':'../dist/conditioner-1.0.0/conditioner.js',
            'Observer':'../dist/conditioner-1.0.0/utils/Observer.js',
            'extendClass':'../dist/conditioner-1.0.0/utils/extendClass'
        }
    },
    urlArgs:'bust=' + (new Date()).getTime()
});

require([
    'ObserverSpec',
    'ConditionerSpec'
],function(){
    (window.mochaPhantomJS ? window.mochaPhantomJS : mocha).run();
});