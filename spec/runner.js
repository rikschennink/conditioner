require.config({
    map:{
        '*':{
            'conditioner':'lib/conditioner-1.0.0.js'
        }
    },
    paths:{
        'extendClass':'../spec/lib/utils/extendClass',
        'Observer':'../spec/lib/utils/Observer'
    },
    urlArgs:'bust=' + (new Date()).getTime()
});

require([
    'ObserverSpec',
    'ConditionerSpec'
],mocha.run);