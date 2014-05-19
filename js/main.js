
// setup requirejs
require.config({
    map:{
        '*':{
            'conditioner':'lib/rikschennink/conditioner',
            'utils/Observer':'lib/rikschennink/utils/Observer',
            'utils/mergeObjects':'lib/rikschennink/utils/mergeObjects'
        }
    },
    shim:{
        'lib/rikschennink/conditioner':[

            // DOMContentLoaded is required for addEventListener to shim the 'DOMContentLoaded' event
            'shim/DOMContentLoaded',
            'shim/addEventListener',

            // Other small shims
            'shim/Array.forEach',
            'shim/Array.filter',
            'shim/Array.map',
            'shim/Array.indexOf',
            'shim/Array.isArray',
            'shim/Function.bind',
            'shim/Object.create',
            'shim/Object.keys'

        ],
        'lib/rikschennink/monitors/media':[
            'shim/matchMedia',
            'shim/matchMedia.addListener'
        ]
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