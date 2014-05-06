
// setup requirejs
require.config({
    map:{
        '*':{
            'conditioner':'lib/rikschennink/conditioner',
            'utils/Observer':'lib/rikschennink/utils/Observer',
            'utils/mergeObjects':'lib/rikschennink/utils/mergeObjects'
        }
    }
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