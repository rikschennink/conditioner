require.config({
    urlArgs:'bust=' + (new Date()).getTime()
});

require([
    'UtilsSpec',
    'APISpec',
    'ObjectSpec'
],function(){
    (window.mochaPhantomJS ? window.mochaPhantomJS : mocha).run();
});