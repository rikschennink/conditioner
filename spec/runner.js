require.config({
    urlArgs:'bust=' + (new Date()).getTime()//,

    //paths:{
    //    //'Observer':'lib/utils/Observer'
   // }
});

require([
    'ObserverSpec',
    'ConditionerSpec',
    'extendsClassSpec'
],function(){
    (window.mochaPhantomJS ? window.mochaPhantomJS : mocha).run();
});