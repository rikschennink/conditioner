
// setup requirejs
require.config({
    baseUrl:'js/',
    paths:{
        'conditioner':'lib/rikschennink/conditioner-1.0.0'
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