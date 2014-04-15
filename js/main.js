
// setup requirejs
require.config({
    baseUrl:'/js',
    map:{
        '*':{
            'conditioner':'lib/rikschennink/conditioner-1.0.0',
            'utils/Observer':'lib/rikschennink/utils/Observer',
            'utils/mergeObjects':'lib/rikschennink/utils/mergeObjects'
        }
    }
    //,
    //path:{
    //    'Observer':'lib/rikschennink/utils'
   // }
});

// load conditioner
require(['conditioner'],function(conditioner) {

    conditioner.init({
        'modules':{
            'ui/StarGazers':{
                'options':{
                    'width':90,
                    'user':'rikschennink',
                    'repo':'conditioner'
                }
            },
            'ui/StorageConsentSelect':{
                'options':{
                    'label':{
                        'level':{
                            'incognito':'Incognito'
                        }
                    }
                }
            },
            'security/StorageConsentGuard':{
                'options':{
                    'levels':['all','incognito','none'],
                    'initial':'none'
                }
            }
        }
    });

});