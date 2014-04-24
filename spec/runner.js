require.config({
    urlArgs:'bust=' + (new Date()).getTime(),
    shim:{
        'lib/conditioner':[
            '../../src/lib/UnaryExpression.js',
            '../../src/lib/BinaryExpression.js',
            '../../src/lib/ExpressionFormatter.js'
        ]
    }
});

require([
    'UtilsSpec',
    'APISpec',
    'ObjectSpec',
    'ExpressionFormatterSpec'
],function(){
    (window.mochaPhantomJS ? window.mochaPhantomJS : mocha).run();
});