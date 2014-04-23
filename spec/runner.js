require.config({
    urlArgs:'bust=' + (new Date()).getTime()
});

require([
    'ObserverSpec',
    'ConditionerSpec',
    'extendsClassSpec'
],function(){
    (window.mochaPhantomJS ? window.mochaPhantomJS : mocha).run();
});